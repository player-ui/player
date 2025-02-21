import { SyncWaterfallHook } from "tapable-ts";
import type { Template } from "@player-ui/types";
import type {
  Node,
  ParseObjectOptions,
  ParseObjectChildOptions,
  Parser,
} from "../parser";
import { NodeType } from "../parser";
import { ViewInstance, ViewPlugin } from "../view";
import type { Options } from "./options";
import type { Resolver } from "../resolver";
import { hasTemplateKey } from "../parser/utils";
import { ConsoleLogger } from "../../logger";

export interface TemplateItemInfo {
  /** The index of the data for the current iteration of the template */
  index: number;
  /** The data for the current iteration of the template */
  data: any;
  /** The depth of the template node */
  depth: number;
}

export interface TemplateSubstitution {
  /** Regular expression to find and replace. The global flag will be always be added to this expression. */
  expression: string | RegExp;
  /** The value to replace matches with. */
  value: string;
}

export type TemplateSubstitutionsFunc = (
  baseSubstitutions: TemplateSubstitution[],
  templateItemInfo: TemplateItemInfo,
) => TemplateSubstitution[];

/** A view plugin to resolve/manage templates */
export default class TemplatePlugin implements ViewPlugin {
  private readonly options: Options;
  private readonly logger: ConsoleLogger;

  hooks: {
    resolveTemplateSubstitutions: SyncWaterfallHook<
      [TemplateSubstitution[], TemplateItemInfo],
      Record<string, any>
    >;
  } = {
    resolveTemplateSubstitutions: new SyncWaterfallHook<
      [TemplateSubstitution[], TemplateItemInfo]
    >(),
  };

  constructor(options: Options) {
    this.options = options;
    this.logger = new ConsoleLogger();
  }

  private parseTemplate(
    parseObject: any,
    node: Node.Template,
    options: Options,
  ): Node.Node | null {
    const { template, depth } = node;
    const data = options.data.model.get(node.data);

    if (!data) {
      return null;
    }

    if (!Array.isArray(data)) {
      throw new Error(`Template using '${node.data}' but is not an array`);
    }

    const values: Array<Node.Node> = [];

    data.forEach((dataItem, index) => {
      const templateSubstitutions =
        this.hooks.resolveTemplateSubstitutions.call(
          [
            {
              expression: new RegExp(`_index${depth || ""}_`),
              value: String(index),
            },
          ],
          {
            depth,
            data: dataItem,
            index,
          },
        );
      let templateStr = JSON.stringify(template);

      for (const { expression, value } of templateSubstitutions) {
        let flags = "g";
        if (typeof expression === "object") {
          flags = `${expression.flags}${expression.global ? "" : "g"}`;
        }

        templateStr = templateStr.replace(new RegExp(expression, flags), value);
      }

      const parsed = parseObject(JSON.parse(templateStr), NodeType.Value, {
        templateDepth: node.depth + 1,
      });

      if (parsed) {
        values.push(parsed);
      }

      if (!node.placement) {
        this.logger.warn(
          "Template node does not specify a position - Defaulting to 'append'.",
        );
        node.placement = "append";
      }
    });

    const result: Node.MultiNode = {
      type: NodeType.MultiNode,
      override: false,
      values,
    };

    return result;
  }

  applyParser(parser: Parser): void {
    parser.hooks.onCreateASTNode.tap("template", (node) => {
      if (node && node.type === NodeType.Template && !node.dynamic) {
        return this.parseTemplate(
          parser.parseObject.bind(parser),
          node,
          this.options,
        );
      }

      return node;
    });

    parser.hooks.parseNode.tap(
      "template",
      (
        obj: any,
        _nodeType: Node.ChildrenTypes,
        options: ParseObjectOptions,
        childOptions?: ParseObjectChildOptions,
      ) => {
        if (childOptions && hasTemplateKey(childOptions.key)) {
          return obj
            .map((template: Template) => {
              const templateAST = parser.createASTNode(
                {
                  type: NodeType.Template,
                  depth: options.templateDepth ?? 0,
                  data: template.data,
                  template: template.value,
                  dynamic: template.dynamic ?? false,
                },
                template,
              );

              if (!templateAST) return;

              if (templateAST.type === NodeType.MultiNode) {
                templateAST.values.forEach((v) => {
                  v.parent = templateAST;
                });
              }

              return {
                path: [...childOptions.path, template.output],
                value: templateAST,
              };
            })
            .filter(Boolean);
        }
      },
    );
  }

  applyResolverHooks(resolver: Resolver): void {
    resolver.hooks.beforeResolve.tap("template", (node, options) => {
      if (node && node.type === NodeType.Template && node.dynamic) {
        return this.parseTemplate(options.parseNode, node, options);
      }

      return node;
    });
  }

  apply(view: ViewInstance): void {
    view.hooks.parser.tap("template", this.applyParser.bind(this));
    view.hooks.resolver.tap("template", this.applyResolverHooks.bind(this));
  }
}
