import type {
  ConditionalType,
  Annotations,
  FunctionType,
  NamedType,
  NodeType,
  NodeTypeWithGenerics,
  ObjectType,
  PrimitiveTypes,
  RecordType,
  RefType,
  TemplateLiteralType,
  TupleType,
  NamedTypeWithGenerics,
} from "@player-tools/xlr";
import type { TopLevelDeclaration } from "@player-tools/xlr-utils";
import ts from "typescript";

const templateTokenize = /(?=true\|false|\.\*|\[0-9]\*)/gm;
const tokenSplit = /(?<=true\|false|\.\*|\[0-9]\*)/gm;

/**
 * Returns if the node is a `PrimitiveTypes`
 */
export function isPrimitiveTypeNode(node: NodeType): node is PrimitiveTypes {
  return (
    node.type === "string" ||
    node.type === "number" ||
    node.type === "boolean" ||
    node.type === "null" ||
    node.type === "any" ||
    node.type === "never" ||
    node.type === "undefined" ||
    node.type === "unknown" ||
    node.type === "void"
  );
}

/**
 * Returns if the named type has generic tokens
 */
export function isGenericNamedType<T extends NamedType = NamedType>(
  nt: NodeType,
): nt is NamedTypeWithGenerics<T> {
  return (nt as NamedTypeWithGenerics).genericTokens?.length > 0;
}

/**
 * Specific error that can be caught to indicate an error in conversion
 */
export class ConversionError extends Error {
  constructor(msg: string) {
    super(msg);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, ConversionError.prototype);
  }

  toString() {
    return `Conversion Error: ${this.message}`;
  }
}

export interface ConvertedType {
  /** Converted input type represented as in TS Nodes */
  type: TopLevelDeclaration;

  /** Types that may require import statements to be added */
  referencedTypes?: Set<string>;

  /** Any additionally referenced types that were deserialized that should be separate declarations */
  additionalTypes?: Map<string, TopLevelDeclaration>;
}

interface TSWriterContext {
  /** */
  factory: ts.NodeFactory;

  /** */
  throwError: (message: string) => never;
}

/** */
export class TSWriter {
  private context: TSWriterContext;
  private importSet: Set<string>;
  private additionalTypes: Map<string, TopLevelDeclaration>;

  constructor(factory?: ts.NodeFactory) {
    this.context = {
      factory: factory ?? ts.factory,
      throwError: (message: string) => {
        throw new ConversionError(message);
      },
    };
    this.importSet = new Set();
    this.additionalTypes = new Map();
  }

  public convertNamedType(type: NamedType): ConvertedType {
    this.importSet.clear();
    this.additionalTypes.clear();

    const finalNode = this.convertNamedTypeNode(type);

    const referencedTypes =
      this.importSet.size > 0 ? this.importSet : undefined;
    const additionalTypes =
      this.additionalTypes.size > 0 ? this.additionalTypes : undefined;

    return {
      type: this.makeAnnotations(finalNode, type),
      referencedTypes,
      additionalTypes,
    };
  }

  private convertNamedTypeNode(type: NamedType): TopLevelDeclaration {
    const typeName = type.name;
    const tsNode = this.convertTypeNode(type);

    let customPrimitiveHeritageClass;
    if (type.type === "object" && type.extends) {
      const refName = type.extends.ref.split("<")[0];
      customPrimitiveHeritageClass = [
        this.context.factory.createHeritageClause(
          ts.SyntaxKind.ExtendsKeyword,
          [
            this.context.factory.createExpressionWithTypeArguments(
              this.context.factory.createIdentifier(refName),
              type.extends.genericArguments
                ? (type.extends.genericArguments.map((node) =>
                    this.convertTypeNode(node),
                  ) as any)
                : undefined,
            ),
          ],
        ),
      ];
    }

    let generics;
    if (isGenericNamedType(type)) {
      generics = this.createTypeParameters(type);
      type.genericTokens.forEach((token) => {
        // clean up any references that are actually generic tokens
        if (this.importSet.has(token.symbol)) {
          this.importSet.delete(token.symbol);
        }
      });
    }

    let finalNode;
    if (ts.isTypeLiteralNode(tsNode)) {
      finalNode = this.makeInterfaceDeclaration(
        typeName,
        tsNode.members,
        generics,
        customPrimitiveHeritageClass,
      );
    } else {
      finalNode = this.makeTypeDeclaration(typeName, tsNode, generics);
    }

    return finalNode;
  }

  private convertTypeNode(type: NodeType): ts.TypeNode {
    if (type.type === "object") {
      return this.createObjectNode(type);
    }

    if (type.type === "and") {
      return this.context.factory.createIntersectionTypeNode(
        type.and.map((element) => {
          return this.convertTypeNode(element);
        }),
      );
    }

    if (type.type === "or") {
      return this.context.factory.createUnionTypeNode(
        type.or.map((element) => {
          return this.convertTypeNode(element);
        }),
      );
    }

    if (type.type === "array") {
      if (type.const) {
        return this.context.factory.createTupleTypeNode(
          type.const.map((element) =>
            this.convertTypeNode(element as NodeType),
          ),
        );
      }

      return this.context.factory.createTypeReferenceNode(
        this.context.factory.createIdentifier("Array"),
        [this.convertTypeNode(type.elementType)],
      );
    }

    if (isPrimitiveTypeNode(type)) {
      return this.createPrimitiveNode(type);
    }

    if (type.type === "conditional") {
      return this.createConditionalTypeNode(type);
    }

    if (type.type === "function") {
      return this.createFunctionDeclarationNode(type);
    }

    if (type.type === "record") {
      return this.createRecordNode(type);
    }

    if (type.type === "ref") {
      return this.createRefNode(type);
    }

    if (type.type === "template") {
      return this.createTemplateLiteral(type);
    }

    if (type.type === "tuple") {
      return this.createTupleNode(type);
    }

    this.context.throwError(
      `Unable to convert node type: ${(type as any).type}`,
    );
  }

  private createRefNode(xlrNode: RefType): ts.TypeReferenceNode {
    const typeArgs: ts.TypeNode[] = [];
    if (xlrNode.genericArguments) {
      xlrNode.genericArguments.forEach((genericArg) => {
        if (genericArg.name) {
          const additionalType = this.convertNamedTypeNode(
            genericArg as NamedType,
          );
          this.additionalTypes.set(genericArg.name, additionalType);
        } else if (genericArg.type === "and") {
          genericArg.and.forEach((type) => {
            if (type.name) {
              const additionalType = this.convertNamedTypeNode(
                type as NamedType,
              );
              this.additionalTypes.set(type.name, additionalType);
            }
          });
        } else if (genericArg.type === "or") {
          genericArg.or.forEach((type) => {
            if (type.name) {
              const additionalType = this.convertNamedTypeNode(
                type as NamedType,
              );
              this.additionalTypes.set(type.name, additionalType);
            }
          });
        } else {
          typeArgs.push(this.convertTypeNode(genericArg));
        }
      });
    }

    const importName = xlrNode.ref.split("<")[0];
    this.importSet.add(importName);
    return this.context.factory.createTypeReferenceNode(importName, typeArgs);
  }

  private createPrimitiveNode(xlrNode: PrimitiveTypes): ts.TypeNode {
    if (
      ((xlrNode.type === "string" ||
        xlrNode.type === "boolean" ||
        xlrNode.type === "number") &&
        xlrNode.const) ||
      xlrNode.type === "null"
    ) {
      return this.context.factory.createLiteralTypeNode(
        this.createLiteralTypeNode(xlrNode),
      );
    }

    switch (xlrNode.type) {
      case "string":
        return this.context.factory.createKeywordTypeNode(
          ts.SyntaxKind.StringKeyword,
        );
      case "number":
        return this.context.factory.createKeywordTypeNode(
          ts.SyntaxKind.NumberKeyword,
        );
      case "boolean":
        return this.context.factory.createKeywordTypeNode(
          ts.SyntaxKind.BooleanKeyword,
        );
      case "any":
        return this.context.factory.createKeywordTypeNode(
          ts.SyntaxKind.AnyKeyword,
        );
      case "unknown":
        return this.context.factory.createKeywordTypeNode(
          ts.SyntaxKind.UnknownKeyword,
        );
      case "never":
        return this.context.factory.createKeywordTypeNode(
          ts.SyntaxKind.NeverKeyword,
        );
      case "undefined":
        return this.context.factory.createKeywordTypeNode(
          ts.SyntaxKind.UndefinedKeyword,
        );
      case "void":
        return this.context.factory.createKeywordTypeNode(
          ts.SyntaxKind.VoidKeyword,
        );
      default:
        this.context.throwError(
          `Unknown primitive type ${(xlrNode as any).type}`,
        );
    }
  }

  private createLiteralTypeNode(
    xlrNode: NodeType,
  ): ts.NullLiteral | ts.BooleanLiteral | ts.LiteralExpression {
    if (xlrNode.type === "boolean") {
      return xlrNode.const
        ? this.context.factory.createTrue()
        : this.context.factory.createFalse();
    }

    if (xlrNode.type === "number") {
      return xlrNode.const
        ? this.context.factory.createNumericLiteral(xlrNode.const)
        : this.context.throwError(
            "Can't make literal type out of non constant number",
          );
    }

    if (xlrNode.type === "string") {
      return xlrNode.const
        ? this.context.factory.createStringLiteral(xlrNode.const, true)
        : this.context.throwError(
            "Can't make literal type out of non constant string",
          );
    }

    if (xlrNode.type === "null") {
      return this.context.factory.createNull();
    }

    this.context.throwError(`Can't make literal out of type ${xlrNode.type}`);
  }

  private createTupleNode(xlrNode: TupleType): ts.TypeNode {
    return this.context.factory.createTupleTypeNode(
      xlrNode.elementTypes.map((e) => {
        if (e.name) {
          return this.context.factory.createNamedTupleMember(
            undefined,
            this.context.factory.createIdentifier(e.name),
            e.optional
              ? this.context.factory.createToken(ts.SyntaxKind.QuestionToken)
              : undefined,
            this.convertTypeNode(e.type),
          );
        }

        return this.convertTypeNode(e.type);
      }),
    );
  }

  private createFunctionDeclarationNode(xlrNode: FunctionType): ts.TypeNode {
    return this.context.factory.createFunctionTypeNode(
      undefined,
      xlrNode.parameters.map((e) => {
        return this.context.factory.createParameterDeclaration(
          undefined,
          undefined,
          e.name,
          e.optional
            ? this.context.factory.createToken(ts.SyntaxKind.QuestionToken)
            : undefined,
          this.convertTypeNode(e.type),
          e.default ? this.createLiteralTypeNode(e.default) : undefined,
        );
      }),
      xlrNode.returnType
        ? this.convertTypeNode(xlrNode.returnType)
        : this.context.factory.createToken(ts.SyntaxKind.VoidKeyword),
    );
  }

  private createRecordNode(xlrNode: RecordType): ts.TypeNode {
    const keyType = this.convertTypeNode(xlrNode.keyType);
    const valueType = this.convertTypeNode(xlrNode.valueType);
    return this.context.factory.createTypeReferenceNode(
      this.context.factory.createIdentifier("Record"),
      [keyType, valueType],
    );
  }

  private createConditionalTypeNode(xlrNode: ConditionalType): ts.TypeNode {
    const leftCheck = this.convertTypeNode(xlrNode.check.left);
    const rightCheck = this.convertTypeNode(xlrNode.check.right);
    const trueValue = this.convertTypeNode(xlrNode.value.true);
    const falseValue = this.convertTypeNode(xlrNode.value.false);

    return this.context.factory.createConditionalTypeNode(
      leftCheck,
      rightCheck,
      trueValue,
      falseValue,
    );
  }

  private createObjectNode(xlrNode: ObjectType): ts.TypeLiteralNode {
    const { properties, additionalProperties = false } = xlrNode;

    const propertyNodes: Array<ts.TypeElement> = [
      ...Object.keys(properties)
        .map((name) => ({ name, ...properties[name] }))
        .map(({ name, node, required }) =>
          this.makeAnnotations(
            this.context.factory.createPropertySignature(
              undefined, // modifiers
              name,
              required
                ? undefined
                : this.context.factory.createToken(ts.SyntaxKind.QuestionToken),
              this.convertTypeNode(node),
            ),
            node,
          ),
        ),
    ];

    if (additionalProperties) {
      propertyNodes.push(
        this.context.factory.createIndexSignature(
          undefined, // modifiers
          [
            this.context.factory.createParameterDeclaration(
              undefined, // modifiers
              undefined, // dotdotdot token
              "key",
              undefined, // question token
              this.context.factory.createKeywordTypeNode(
                ts.SyntaxKind.StringKeyword,
              ),
            ),
          ],
          this.convertTypeNode(additionalProperties),
        ),
      );
    }

    return this.context.factory.createTypeLiteralNode(propertyNodes);
  }

  private createTemplateLiteral(xlrNode: TemplateLiteralType) {
    const templateSegments = xlrNode.format.split(templateTokenize);
    let templateHead;

    if (templateSegments.length % 2 === 0) {
      templateHead = this.context.factory.createTemplateHead(
        templateSegments[0],
      );
      templateSegments.splice(0, 1);
    } else {
      templateHead = this.context.factory.createTemplateHead("");
    }

    return this.context.factory.createTemplateLiteralType(
      templateHead,
      templateSegments.map((segments, i) => {
        const [regexSegment, stringSegment = ""] = segments.split(tokenSplit);

        let regexTemplateType: ts.KeywordSyntaxKind;
        if (regexSegment === ".*") {
          regexTemplateType = ts.SyntaxKind.StringKeyword;
        } else if (regexSegment === "[0-9]*") {
          regexTemplateType = ts.SyntaxKind.NumberKeyword;
        } else if (regexSegment === "true|false") {
          regexTemplateType = ts.SyntaxKind.BooleanKeyword;
        } else {
          this.context.throwError(
            `Can't make template literal type from regex ${regexSegment}`,
          );
        }

        let stringTemplateType;

        if (i === templateSegments.length - 1) {
          stringTemplateType =
            this.context.factory.createTemplateTail(stringSegment);
        } else {
          stringTemplateType =
            this.context.factory.createTemplateMiddle(stringSegment);
        }

        return this.context.factory.createTemplateLiteralTypeSpan(
          this.context.factory.createKeywordTypeNode(regexTemplateType),
          stringTemplateType,
        );
      }),
    );
  }

  private createGenericArgumentNode(node?: NodeType): ts.TypeNode | undefined {
    if (node) {
      if (node.type === "object" && node.name) {
        const additionalType = this.convertNamedTypeNode(
          node as NamedType<ObjectType>,
        );
        this.additionalTypes.set(node.name, additionalType);
        return this.context.factory.createTypeReferenceNode(node.name);
      }

      return this.convertTypeNode(node);
    }

    return undefined;
  }

  private makeAnnotations<T extends ts.Node>(
    tsNode: T,
    xlrAnnotations: Annotations,
  ) {
    let comment = xlrAnnotations.description;
    if (!comment) {
      return tsNode;
    }

    if (comment.includes("\n")) {
      comment = `*\n${comment
        .split("\n")
        .map((s) => ` * ${s}`)
        .join("\n")}\n`;
    } else {
      comment = `* ${comment} `;
    }

    return ts.addSyntheticLeadingComment(
      tsNode,
      ts.SyntaxKind.MultiLineCommentTrivia,
      comment,
      true,
    );
  }

  private createTypeParameters(
    genericXLRNode: NodeTypeWithGenerics,
  ): Array<ts.TypeParameterDeclaration> {
    return genericXLRNode.genericTokens.map((generic) => {
      return this.context.factory.createTypeParameterDeclaration(
        undefined,
        generic.symbol,
        this.createGenericArgumentNode(generic.constraints),
        this.createGenericArgumentNode(generic.default),
      );
    });
  }

  private makeInterfaceDeclaration(
    name: string,
    node: ts.NodeArray<ts.TypeElement>,
    generics: Array<ts.TypeParameterDeclaration> | undefined,
    heritageClass: ts.HeritageClause[] | undefined,
  ) {
    return this.context.factory.createInterfaceDeclaration(
      this.context.factory.createModifiersFromModifierFlags(
        ts.ModifierFlags.Export,
      ),
      this.context.factory.createIdentifier(name),
      generics, // type parameters
      heritageClass, // heritage
      node,
    );
  }

  private makeTypeDeclaration(
    name: string,
    node: ts.TypeNode,
    generics: Array<ts.TypeParameterDeclaration> | undefined,
  ) {
    return this.context.factory.createTypeAliasDeclaration(
      this.context.factory.createModifiersFromModifierFlags(
        ts.ModifierFlags.Export,
      ),
      this.context.factory.createIdentifier(name),
      generics, // type parameters
      node,
    );
  }
}
