import { SyncWaterfallHook, SyncBailHook } from "tapable-ts";
import { NestedError } from "ts-nested-error";
import { parseExpression } from "./parser";
import * as DEFAULT_EXPRESSION_HANDLERS from "./evaluator-functions";
import { collateAwaitable, isAwaitable, isPromiseLike } from "./async";
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
const andandOperator: BinaryOperator = (ctx, a, b, async) => {
  return LogicalOperators.and(ctx, a, b, async);
};
andandOperator.resolveParams = false;

/** a || b -- but with short cutting if first value is true */
const ororOperator: BinaryOperator = (ctx, a, b, async) => {
  return LogicalOperators.or(ctx, a, b, async);
};
ororOperator.resolveParams = false;

const DEFAULT_BINARY_OPERATORS: Record<string, BinaryOperator> = {
  // TODO: A lot of these functions used to do type coercion. Not sure if we want to keep that behavior or not.
  "+": (a: any, b: any) => a + b,
  "-": (a: any, b: any) => a - b,
  "*": (a: any, b: any) => a * b,
  "/": (a: any, b: any) => a / b,
  "%": (a: any, b: any) => a % b,

  // Promise-aware comparison operators
  // eslint-disable-next-line
  "==": makePromiseAwareBinaryOp((a: any, b: any) => a == b),
  // eslint-disable-next-line
  "!=": makePromiseAwareBinaryOp((a: any, b: any) => a != b),
  ">": makePromiseAwareBinaryOp((a: any, b: any) => a > b),
  ">=": makePromiseAwareBinaryOp((a: any, b: any) => a >= b),
  "<": makePromiseAwareBinaryOp((a: any, b: any) => a < b),
  "<=": makePromiseAwareBinaryOp((a: any, b: any) => a <= b),
  "!==": makePromiseAwareBinaryOp((a: any, b: any) => a !== b),
  "===": makePromiseAwareBinaryOp((a: any, b: any) => a === b),

  "&&": andandOperator,
  "||": ororOperator,

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
  "!": makePromiseAwareUnaryOp((a: any) => !a),
};

/**
 * Higher-order function that makes any binary operation Promise-aware
 */
function makePromiseAwareBinaryOp<T>(
  operation: (a: any, b: any) => T,
): (a: any, b: any, async: boolean) => T | Promise<T> {
  return (a: any, b: any, async: boolean) => {
    //async handler
    if (async && (isAwaitable(a) || isAwaitable(b))) {
      return collateAwaitable([
        Promise.resolve(a),
        Promise.resolve(b),
      ]).awaitableThen(([resolvedA, resolvedB]) =>
        operation(resolvedA, resolvedB),
      );
    }
    //sync handler
    return operation(a, b);
  };
}

/**
 * Higher-order function that makes any unary operation Promise-aware
 */
function makePromiseAwareUnaryOp<T>(
  operation: (a: any) => T,
): (a: any, async: boolean) => T | Promise<T> {
  return (a: any, async: boolean) => {
    //async handler
    if (async && isAwaitable(a)) {
      return a.awaitableThen((resolved: any) => operation(resolved));
    }
    //sync handler
    return operation(a);
  };
}

/**
 * Utility for handling conditional branching with Promises
 */
function handleConditionalBranching(
  testValue: any,
  getTrueBranch: () => any,
  getFalseBranch: () => any,
  resolveNode: (node: any) => any,
  async: boolean,
): any {
  //async handler
  if (async && isAwaitable(testValue)) {
    return testValue.awaitableThen((resolved: boolean) => {
      const branch = resolved ? getTrueBranch() : getFalseBranch();
      const branchResult = resolveNode(branch);
      return isAwaitable(branchResult)
        ? Promise.resolve(branchResult)
        : branchResult;
    });
  }

  // sync handler
  const branch = testValue ? getTrueBranch() : getFalseBranch();
  return resolveNode(branch);
}

/**
 * Utility for handling collections (arrays/objects) with potential Promises
 */
const PromiseCollectionHandler = {
  /**
   * Handle array with potential Promise elements
   */
  handleArray<T>(items: T[], async: boolean): T[] | Promise<T[]> {
    if (!async) {
      return items;
    }
    const hasPromises = items.some((item) => isAwaitable(item));
    return hasPromises ? collateAwaitable(items) : items;
  },

  /**
   * Handle object with potential Promise keys/values
   */
  handleObject(
    attributes: Array<{ key: any; value: any }>,
    resolveNode: (node: any) => any,
    async: boolean,
  ): Record<string, any> | Promise<Record<string, any>> {
    const resolvedAttributes: Record<string, any> = {};
    const promises: Promise<void>[] = [];
    let hasPromises = false;

    attributes.forEach((attr) => {
      const key = resolveNode(attr.key);
      const value = resolveNode(attr.value);

      //async handler
      if (async && (isAwaitable(key) || isAwaitable(value))) {
        hasPromises = true;
        const keyPromise = Promise.resolve(key);
        const valuePromise = Promise.resolve(value);

        promises.push(
          collateAwaitable([keyPromise, valuePromise]).awaitableThen(
            ([resolvedKey, resolvedValue]) => {
              resolvedAttributes[resolvedKey] = resolvedValue;
            },
          ),
        );
      } else {
        resolvedAttributes[key] = value;
      }
    });

    return hasPromises
      ? collateAwaitable(promises).awaitableThen(() => resolvedAttributes)
      : resolvedAttributes;
  },
};

/**
 * Smart logical operators that handle short-circuiting with Promises
 */
const LogicalOperators = {
  and: (ctx: any, leftNode: any, rightNode: any, async: boolean) => {
    const leftResult = ctx.evaluate(leftNode);

    if (async && isAwaitable(leftResult)) {
      return leftResult.awaitableThen((awaitedLeft: any) => {
        if (!awaitedLeft) return awaitedLeft; // Short circuit
        const rightResult = ctx.evaluate(rightNode);
        return isAwaitable(rightResult)
          ? rightResult
          : Promise.resolve(rightResult);
      });
    }

    // Sync short-circuiting
    return leftResult && ctx.evaluate(rightNode);
  },

  or: (ctx: any, leftNode: any, rightNode: any, async: boolean) => {
    const leftResult = ctx.evaluate(leftNode);

    if (async && isAwaitable(leftResult)) {
      return leftResult.awaitableThen((awaitedLeft: any) => {
        if (awaitedLeft) return awaitedLeft; // Short circuit
        const rightResult = ctx.evaluate(rightNode);
        return isAwaitable(rightResult)
          ? rightResult
          : Promise.resolve(rightResult);
      });
    }

    // Sync short-circuiting
    return leftResult || ctx.evaluate(rightNode);
  },
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

  /**
   * Evaluate functions in an async context
   * @experimental These Player APIs are in active development and may change. Use with caution
   */
  public evaluateAsync(
    expr: ExpressionType,
    options?: ExpressionEvaluatorOptions,
  ): Promise<any> {
    // handle async expression block
    if (Array.isArray(expr)) {
      return collateAwaitable(
        expr.map(async (exp) =>
          this.evaluate(exp, { ...options, async: true } as any),
        ),
      ).awaitableThen((values) => {
        return values.pop();
      });
    } else {
      return this.evaluate(expr, { ...options, async: true } as any);
    }
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
    const isAsync = options.async ?? false;

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
            return operator(expressionContext, node.left, node.right, isAsync);
          }

          const left = resolveNode(node.left);
          const right = resolveNode(node.right);

          // Handle promises in binary operations
          if (options.async && (isAwaitable(left) || isAwaitable(right))) {
            return collateAwaitable([left, right]).awaitableThen(
              ([leftVal, rightVal]) =>
                operator(expressionContext, leftVal, rightVal, isAsync),
            );
          }

          return operator(expressionContext, left, right, isAsync);
        }

        const left = resolveNode(node.left);
        const right = resolveNode(node.right);

        if (options.async && (isAwaitable(left) || isAwaitable(right))) {
          return collateAwaitable([left, right]).awaitableThen(
            ([leftVal, rightVal]) => operator(leftVal, rightVal, isAsync),
          );
        }

        return operator(left, right, isAsync);
      }

      return;
    }

    if (node.type === "UnaryExpression") {
      const operator = this.operators.unary.get(node.operator);

      if (operator) {
        if ("resolveParams" in operator) {
          if (operator.resolveParams === false) {
            return operator(expressionContext, node.argument, isAsync);
          }

          const arg = resolveNode(node.argument);

          if (options.async && isAwaitable(arg)) {
            return arg.awaitableThen((argVal) =>
              operator(expressionContext, argVal, isAsync),
            );
          }

          return operator(expressionContext, arg, isAsync);
        }

        const arg = resolveNode(node.argument);

        if (options.async && isAwaitable(arg)) {
          return arg.awaitableThen((argVal) => operator(argVal, isAsync));
        }

        return operator(arg, isAsync);
      }

      return;
    }

    if (node.type === "Object") {
      return PromiseCollectionHandler.handleObject(
        node.attributes,
        resolveNode,
        options.async || false,
      );
    }

    if (node.type === "CallExpression") {
      const expressionName = node.callTarget.name;

      const operator = this.operators.expressions.get(expressionName);

      if (!operator) {
        throw new Error(`Unknown expression function: ${expressionName}`);
      }

      if (operator.name === "waitFor" && !options.async) {
        throw new Error("Usage of await outside of async context");
      }

      if ("resolveParams" in operator && operator.resolveParams === false) {
        return operator(expressionContext, ...node.args);
      }

      const args = node.args.map((n) => resolveNode(n));

      // Check if any arguments are promises
      if (options.async) {
        const hasPromises = args.some(isAwaitable);

        if (hasPromises) {
          return collateAwaitable(args).awaitableThen((resolvedArgs) =>
            operator(expressionContext, ...resolvedArgs),
          );
        }
      }

      return operator(expressionContext, ...args);
    }

    if (node.type === "ModelRef") {
      return model.get(node.ref, { context: { model: options.model } });
    }

    if (node.type === "MemberExpression") {
      const obj = resolveNode(node.object);
      const prop = resolveNode(node.property);

      if (options.async && (isAwaitable(obj) || isAwaitable(prop))) {
        return collateAwaitable([obj, prop]).awaitableThen(
          ([objVal, propVal]) => objVal[propVal],
        );
      }

      return obj[prop];
    }

    if (node.type === "Assignment") {
      if (node.left.type === "ModelRef") {
        const value = resolveNode(node.right);

        if (isPromiseLike(value)) {
          if (options.async && isAwaitable(value)) {
            return value.awaitableThen((resolvedValue) => {
              model.set([[(node.left as any).ref, resolvedValue]]);
              return resolvedValue;
            });
          } else {
            options.logger?.warn(
              "Unawaited promise written to mode, this behavior is undefined and may change in future releases",
            );
          }
        }

        model.set([[(node.left as any).ref, value]]);
        return value;
      }

      if (node.left.type === "Identifier") {
        const value = resolveNode(node.right);

        if (options.async && isAwaitable(value)) {
          return value.awaitableThen((resolvedValue) => {
            this.vars[(node.left as any).name] = resolvedValue;
            return resolvedValue;
          });
        }

        this.vars[(node.left as any).name] = value;
        return value;
      }

      return;
    }

    if (node.type === "ConditionalExpression") {
      const testResult = resolveNode(node.test);

      return handleConditionalBranching(
        testResult,
        () => node.consequent,
        () => node.alternate,
        resolveNode,
        isAsync,
      );
    }

    if (node.type === "ArrayExpression") {
      const results = node.elements.map((ele) => resolveNode(ele));
      return PromiseCollectionHandler.handleArray(results, isAsync);
    }

    if (node.type === "Modification") {
      const operation = this.operators.binary.get(node.operator);

      if (operation) {
        let newValue;

        if ("resolveParams" in operation) {
          if (operation.resolveParams === false) {
            newValue = operation(
              expressionContext,
              node.left,
              node.right,
              isAsync,
            );
          } else {
            const left = resolveNode(node.left);
            const right = resolveNode(node.right);

            if (options.async && (isAwaitable(left) || isAwaitable(right))) {
              newValue = collateAwaitable([left, right]).awaitableThen(
                ([leftVal, rightVal]) =>
                  operation(expressionContext, leftVal, rightVal, isAsync),
              );
            } else {
              newValue = operation(expressionContext, left, right, isAsync);
            }
          }
        } else {
          const left = resolveNode(node.left);
          const right = resolveNode(node.right);

          if (options.async && (isAwaitable(left) || isAwaitable(right))) {
            newValue = collateAwaitable([left, right]).awaitableThen(
              ([leftVal, rightVal]) => operation(leftVal, rightVal, isAsync),
            );
          } else {
            newValue = operation(left, right, isAsync);
          }
        }

        if (node.left.type === "ModelRef") {
          if (options.async && isAwaitable(newValue)) {
            return newValue.awaitableThen((resolvedValue) => {
              model.set([[(node.left as any).ref, resolvedValue]]);
              return resolvedValue;
            });
          }
          model.set([[(node.left as any).ref, newValue]]);
        } else if (node.left.type === "Identifier") {
          if (options.async && isAwaitable(newValue)) {
            return newValue.awaitableThen((resolvedValue) => {
              this.vars[(node.left as any).name] = resolvedValue;
              return resolvedValue;
            });
          }
          this.vars[(node.left as any).name] = newValue;
        }

        return newValue;
      }

      return resolveNode(node.left);
    }
  }
}
