import { SyncWaterfallHook, SyncBailHook } from "tapable-ts";
import { NestedError } from "ts-nested-error";
import { parseExpression } from "./parser";
import * as DEFAULT_EXPRESSION_HANDLERS from "./evaluator-functions";
import { isExpressionNode } from "./types";
import { isObjectExpression } from "./utils";
import type {
  ExpressionNode,
  BinaryOperator,
  UnaryOperator,
  ExpressionType,
  ExpressionContext,
  ExpressionHandler,
} from "./types";

/** a && b -- but handles short cutting if the first value is false */
const andandOperator: BinaryOperator = (ctx, a, b) => {
  return ctx.evaluate(a) && ctx.evaluate(b);
};

andandOperator.resolveParams = false;

/** a || b -- but with short cutting if first value is true */
const ororOperator: BinaryOperator = (ctx, a, b) => {
  return ctx.evaluate(a) || ctx.evaluate(b);
};

ororOperator.resolveParams = false;

const DEFAULT_BINARY_OPERATORS: Record<string, BinaryOperator> = {
  // TODO: A lot of these functions used to do type coercion. Not sure if we want to keep that behavior or not.
  "+": (a: any, b: any) => a + b,
  "-": (a: any, b: any) => a - b,
  "*": (a: any, b: any) => a * b,
  "/": (a: any, b: any) => a / b,
  "%": (a: any, b: any) => a % b,

  // eslint-disable-next-line
  "==": (a: any, b: any) => a == b,

  // eslint-disable-next-line
  "!=": (a: any, b: any) => a != b,
  ">": (a: any, b: any) => a > b,
  ">=": (a: any, b: any) => a >= b,
  "<": (a: any, b: any) => a < b,
  "<=": (a: any, b: any) => a <= b,
  "&&": andandOperator,
  "||": ororOperator,
  "!==": (a: any, b: any) => a !== b,
  "===": (a: any, b: any) => a === b,

  // eslint-disable-next-line
  "|": (a: any, b: any) => a | b,

  // eslint-disable-next-line
  "&": (a: any, b: any) => a & b,
  "+=": (a: any, b: any) => a + b,
  "-=": (a: any, b: any) => a - b,

  // eslint-disable-next-line
  "&=": (a: any, b: any) => a & b,

  // eslint-disable-next-line
  "|=": (a: any, b: any) => a | b,
};

const DEFAULT_UNARY_OPERATORS: Record<string, UnaryOperator> = {
  "-": (a: any) => -a,
  "+": (a: any) => Number(a),
  "!": (a: any) => !a,
};

export interface HookOptions extends ExpressionContext {
  /** Given an expression node  */
  resolveNode: (node: ExpressionNode) => any;

  /** Enabling this flag skips calling the onError hook, and just throws errors back to the caller.
   * The caller is responsible for handling the error.
   */
  throwErrors?: boolean;

  /** Whether expressions should be parsed strictly or not */
  strict?: boolean;

  /** Whether the expression should be evaluated asynchronously */
  async?: boolean;
}

interface AsyncHookOptions extends HookOptions {
  /** Given an expression node, return a promise that resolves to the value */
  resolveNode: (node: ExpressionNode) => Promise<any>;
  /** Whether the expression should be evaluated asynchronously */
  async: true;
}

export type ExpressionEvaluatorOptions = Omit<
  HookOptions,
  "resolveNode" | "evaluate"
>;

export type ExpressionEvaluatorFunction = (
  exp: ExpressionType,
  options?: ExpressionEvaluatorOptions,
) => any;

/**
 * The expression evaluator is responsible for parsing and executing anything in the custom expression language
 * */
export class ExpressionEvaluator {
  private readonly vars: Record<string, any> = {};
  public readonly hooks: {
    resolve: SyncWaterfallHook<[any, ExpressionNode, HookOptions]>;
    resolveOptions: SyncWaterfallHook<[HookOptions]>;
    beforeEvaluate: SyncWaterfallHook<[ExpressionType, HookOptions]>;
    onError: SyncBailHook<[Error], true>;
  } = {
    /** Resolve an AST node for an expression to a value */
    resolve: new SyncWaterfallHook<[any, ExpressionNode, HookOptions]>(),
    /** Gets the options that will be passed in calls to the resolve hook */
    resolveOptions: new SyncWaterfallHook<[HookOptions]>(),
    /** Allows users to change the expression to be evaluated before processing */
    beforeEvaluate: new SyncWaterfallHook<[ExpressionType, HookOptions]>(),
    /**
     * An optional means of handling an error in the expression execution
     * Return true if handled, to stop propagation of the error
     */
    onError: new SyncBailHook<[Error], true>(),
  };

  private readonly expressionsCache: Map<string, ExpressionNode> = new Map();

  private readonly defaultHookOptions: HookOptions;

  public readonly operators: {
    binary: Map<string, BinaryOperator>;
    unary: Map<string, UnaryOperator>;
    expressions: Map<string, ExpressionHandler<any, any>>;
  } = {
    binary: new Map<string, BinaryOperator>(
      Object.entries(DEFAULT_BINARY_OPERATORS),
    ),
    unary: new Map<string, UnaryOperator>(
      Object.entries(DEFAULT_UNARY_OPERATORS),
    ),
    expressions: new Map<string, ExpressionHandler<any, any>>([
      ...Object.entries(DEFAULT_EXPRESSION_HANDLERS),
      ["await", DEFAULT_EXPRESSION_HANDLERS.waitFor],
    ]),
  };

  public reset(): void {
    this.expressionsCache.clear();
  }

  constructor(defaultOptions: ExpressionEvaluatorOptions) {
    this.defaultHookOptions = {
      ...defaultOptions,
      evaluate: (expr) => this.evaluate(expr, this.defaultHookOptions),
      resolveNode: (node: ExpressionNode) =>
        this._execAST(node, this.defaultHookOptions),
    };

    this.hooks.resolve.tap("ExpressionEvaluator", (result, node, options) => {
      if (options.async) {
        return this._resolveNodeAsync(
          result,
          node,
          options as AsyncHookOptions,
        );
      }

      return this._resolveNode(result, node, options);
    });
    this.evaluate = this.evaluate.bind(this);
  }

  public evaluate(
    expr: ExpressionType,
    options?: ExpressionEvaluatorOptions,
  ): any {
    const resolvedOpts = this.hooks.resolveOptions.call({
      ...this.defaultHookOptions,
      ...options,
      resolveNode: (node: ExpressionNode) => this._execAST(node, resolvedOpts),
    });

    let expression = this.hooks.beforeEvaluate.call(expr, resolvedOpts) ?? expr;

    // Unwrap any returned expression type
    // Since this could also be an object type, we need to recurse through it until we find the end
    while (isObjectExpression(expression)) {
      expression = expression.value;
    }

    // Check for literals
    if (
      typeof expression === "number" ||
      typeof expression === "boolean" ||
      expression === undefined ||
      expression === null
    ) {
      return expression;
    }

    // Skip doing anything with objects that are _actually_ just parsed expression nodes
    if (isExpressionNode(expression)) {
      return this._execAST(expression, resolvedOpts);
    }

    if (Array.isArray(expression)) {
      return expression.reduce(
        (_nothing, exp) => this.evaluate(exp, options),
        null,
      );
    }

    return this._execString(String(expression), resolvedOpts);
  }

  public evaluateAsync(
    expr: ExpressionType,
    options?: ExpressionEvaluatorOptions,
  ): Promise<any> {
    return this.evaluate(expr, { ...options, async: true } as any);
  }

  public addExpressionFunction<T extends readonly unknown[], R>(
    name: string,
    handler: ExpressionHandler<T, R>,
  ): void {
    this.operators.expressions.set(name, handler);
  }

  public addBinaryOperator(operator: string, handler: BinaryOperator): void {
    this.operators.binary.set(operator, handler);
  }

  public addUnaryOperator(operator: string, handler: UnaryOperator): void {
    this.operators.unary.set(operator, handler);
  }

  public setExpressionVariable(name: string, value: unknown): void {
    this.vars[name] = value;
  }

  public getExpressionVariable(name: string): unknown {
    return this.vars[name];
  }

  private _execAST(node: ExpressionNode, options: HookOptions): any {
    return this.hooks.resolve.call(undefined, node, options);
  }

  private _execString(exp: string, options: HookOptions) {
    if (exp === "") {
      return exp;
    }

    const matches = exp.match(/^@\[(.*)\]@$/);
    let matchedExp = exp;
    if (matches) {
      const [, matched] = Array.from(matches); // In case the expression was surrounded by @[ ]@
      if (matched) {
        matchedExp = matched;
      }
    }

    let storedAST: ExpressionNode;

    try {
      storedAST =
        this.expressionsCache.get(matchedExp) ??
        parseExpression(matchedExp, { strict: options.strict });
      this.expressionsCache.set(matchedExp, storedAST);
    } catch (e: any) {
      if (options.throwErrors || !this.hooks.onError.call(e)) {
        // Only throw the error if it's not handled by the hook, or throwErrors is true
        throw new NestedError(`Error parsing expression: ${exp}`, e);
      }

      return;
    }

    try {
      return this._execAST(storedAST, options);
    } catch (e: any) {
      if (options.throwErrors || !this.hooks.onError.call(e)) {
        // Only throw the error if it's not handled by the hook, or throwErrors is true
        throw new NestedError(`Error evaluating expression: ${exp}`, e);
      }
    }
  }

  private _resolveNode(
    _currentValue: any,
    node: ExpressionNode,
    options: HookOptions,
  ): unknown {
    const { resolveNode, model } = options;

    const expressionContext: ExpressionContext = {
      ...options,
      evaluate: (expr) => this.evaluate(expr, options),
    };

    if (node.type === "Literal") {
      return node.value;
    }

    if (node.type === "Identifier") {
      return this.vars[node.name];
    }

    if (node.type === "Compound" || node.type === "ThisExpression") {
      throw new Error(`Expression type: ${node.type} is not supported`);
    }

    if (node.type === "BinaryExpression" || node.type === "LogicalExpression") {
      const operator = this.operators.binary.get(node.operator);

      if (operator) {
        if ("resolveParams" in operator) {
          if (operator.resolveParams === false) {
            return operator(expressionContext, node.left, node.right);
          }

          return operator(
            expressionContext,
            resolveNode(node.left),
            resolveNode(node.right),
          );
        }

        return operator(resolveNode(node.left), resolveNode(node.right));
      }

      return;
    }

    if (node.type === "UnaryExpression") {
      const operator = this.operators.unary.get(node.operator);

      if (operator) {
        if ("resolveParams" in operator) {
          return operator(
            expressionContext,
            operator.resolveParams === false
              ? node.argument
              : resolveNode(node.argument),
          );
        }

        return operator(resolveNode(node.argument));
      }

      return;
    }

    if (node.type === "Object") {
      const { attributes } = node;
      const resolvedAttributes: any = {};

      attributes.forEach((attr) => {
        const key = resolveNode(attr.key);
        const value = resolveNode(attr.value);
        resolvedAttributes[key] = value;
      });

      return resolvedAttributes;
    }

    if (node.type === "CallExpression") {
      const expressionName = node.callTarget.name;

      const operator = this.operators.expressions.get(expressionName);

      if (!operator) {
        throw new Error(`Unknown expression function: ${expressionName}`);
      }

      if ("resolveParams" in operator && operator.resolveParams === false) {
        return operator(expressionContext, ...node.args);
      }

      const args = node.args.map((n) => resolveNode(n));

      return operator(expressionContext, ...args);
    }

    if (node.type === "ModelRef") {
      return model.get(node.ref, { context: { model: options.model } });
    }

    if (node.type === "MemberExpression") {
      const obj = resolveNode(node.object);
      const prop = resolveNode(node.property);

      return obj[prop];
    }

    if (node.type === "Assignment") {
      if (node.left.type === "ModelRef") {
        const value = resolveNode(node.right);
        model.set([[node.left.ref, value]]);

        return value;
      }

      if (node.left.type === "Identifier") {
        const value = resolveNode(node.right);
        this.vars[node.left.name] = value;
        return value;
      }

      return;
    }

    if (node.type === "ConditionalExpression") {
      const result = resolveNode(node.test) ? node.consequent : node.alternate;

      return resolveNode(result);
    }

    if (node.type === "ArrayExpression") {
      return node.elements.map((ele) => resolveNode(ele));
    }

    if (node.type === "Modification") {
      const operation = this.operators.binary.get(node.operator);

      if (operation) {
        let newValue;

        if ("resolveParams" in operation) {
          if (operation.resolveParams === false) {
            newValue = operation(expressionContext, node.left, node.right);
          } else {
            newValue = operation(
              expressionContext,
              resolveNode(node.left),
              resolveNode(node.right),
            );
          }
        } else {
          newValue = operation(resolveNode(node.left), resolveNode(node.right));
        }

        if (node.left.type === "ModelRef") {
          model.set([[node.left.ref, newValue]]);
        } else if (node.left.type === "Identifier") {
          this.vars[node.left.name] = newValue;
        }

        return newValue;
      }

      return resolveNode(node.left);
    }
  }

  private async _resolveNodeAsync(
    _currentValue: any,
    node: ExpressionNode,
    options: AsyncHookOptions,
  ): Promise<unknown> {
    const { resolveNode, model } = options;

    const expressionContext: ExpressionContext = {
      ...options,
      evaluate: (expr) => this.evaluate(expr, options),
    };

    if (node.type === "BinaryExpression" || node.type === "LogicalExpression") {
      const operator = this.operators.binary.get(node.operator);

      if (operator) {
        if ("resolveParams" in operator) {
          if (operator.resolveParams === false) {
            return operator(expressionContext, node.left, node.right);
          }

          return operator(
            expressionContext,
            await resolveNode(node.left),
            await resolveNode(node.right),
          );
        }

        return operator(
          await resolveNode(node.left),
          await resolveNode(node.right),
        );
      }

      return;
    }

    if (node.type === "UnaryExpression") {
      const operator = this.operators.unary.get(node.operator);

      if (operator) {
        if ("resolveParams" in operator) {
          return operator(
            expressionContext,
            operator.resolveParams === false
              ? node.argument
              : await resolveNode(node.argument),
          );
        }

        return operator(await resolveNode(node.argument));
      }

      return;
    }

    if (node.type === "Object") {
      const { attributes } = node;
      const resolvedAttributes: any = {};

      await Promise.all(
        attributes.map(async (attr) => {
          const key = await resolveNode(attr.key);
          const value = await resolveNode(attr.value);
          resolvedAttributes[key] = value;
        }),
      );

      return resolvedAttributes;
    }

    if (node.type === "CallExpression") {
      const expressionName = node.callTarget.name;

      const operator = this.operators.expressions.get(expressionName);

      if (!operator) {
        throw new Error(`Unknown expression function: ${expressionName}`);
      }

      if ("resolveParams" in operator && operator.resolveParams === false) {
        return operator(expressionContext, ...node.args);
      }

      const args = await Promise.all(
        node.args.map(async (n) => await resolveNode(n)),
      );

      return operator(expressionContext, ...args);
    }

    if (node.type === "ModelRef") {
      return model.get(node.ref, { context: { model: options.model } });
    }

    if (node.type === "MemberExpression") {
      const obj = await resolveNode(node.object);
      const prop = await resolveNode(node.property);

      return obj[prop];
    }

    if (node.type === "Assignment") {
      if (node.left.type === "ModelRef") {
        const value = await resolveNode(node.right);
        model.set([[node.left.ref, value]]);

        return value;
      }

      if (node.left.type === "Identifier") {
        const value = await resolveNode(node.right);
        this.vars[node.left.name] = value;
        return value;
      }

      return;
    }

    if (node.type === "ConditionalExpression") {
      const result = (await resolveNode(node.test))
        ? node.consequent
        : node.alternate;

      return resolveNode(result);
    }

    if (node.type === "ArrayExpression") {
      return Promise.all(
        node.elements.map(async (ele) => await resolveNode(ele)),
      );
    }

    if (node.type === "Modification") {
      const operation = this.operators.binary.get(node.operator);

      if (operation) {
        let newValue;

        if ("resolveParams" in operation) {
          if (operation.resolveParams === false) {
            newValue = operation(expressionContext, node.left, node.right);
          } else {
            newValue = operation(
              expressionContext,
              await resolveNode(node.left),
              await resolveNode(node.right),
            );
          }
        } else {
          newValue = operation(
            await resolveNode(node.left),
            await resolveNode(node.right),
          );
        }

        if (node.left.type === "ModelRef") {
          model.set([[node.left.ref, newValue]]);
        } else if (node.left.type === "Identifier") {
          this.vars[node.left.name] = newValue;
        }

        return newValue;
      }

      return resolveNode(node.left);
    }

    return this._resolveNode(_currentValue, node, options);
  }
}
