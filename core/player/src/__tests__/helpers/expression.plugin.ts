import type { Player, PlayerPlugin } from "../../player";
import type {
  Binding,
  Expression,
  ExpressionHandler,
  ValidatorFunction,
} from "../..";

/**
 * Adds a validation provider to the validator registry
 *
 * @param vc - validation controller
 */
export const sumFunction: ExpressionHandler<
  [Binding | unknown, string | string[]],
  number
> = (ctx, modelOrReference, propName) => {
  const values = Array.isArray(modelOrReference)
    ? modelOrReference
    : [modelOrReference];

  let total = 0;
  values.forEach((value) => {
    total += ctx.model.get(value);
  });

  return total;
};

/** A plugin that tracks bindings and attaches validations to anything w/ a binding property */
export default class TestExpressionPlugin implements PlayerPlugin {
  name = "expressions";

  apply(player: Player) {
    player.hooks.expressionEvaluator.tap(this.name, (expressionEvaluator) => {
      expressionEvaluator.addExpressionFunction("sumValues", sumFunction);
    });
  }
}

/** A test validator function that makes sure the value is present */
export const required: ValidatorFunction<{
  /** An optional expression to limit the required check only if true */
  if?: Expression;

  /** An optional expression to limit the required check only if false */
  ifNot?: Expression;
}> = (context, value) => {
  if (value === undefined || value === null || value === "") {
    const message = context.constants.getConstants(
      "validation.required",
      "constants",
      "A value is required",
    ) as string;
    return { message, severity: "error" };
  }
};

/** A test validator function that makes sure the value is present given a condition */
export const requiredIf: ValidatorFunction<{
  /** binding of the required field */
  param?: string;
  /** expression that needs to be true for the field to be required */
  exp?: string;
}> = (context, value, options) => {
  let ifExp = "false";
  const evaluatedVal = context.evaluate(options?.exp || options?.param);

  if (typeof evaluatedVal === "boolean") ifExp = JSON.stringify(evaluatedVal);

  return required(context, value, { ...options, if: ifExp });
};

/** A test plugin that registers requiredIf validation */
export class RequiredIfValidationProviderPlugin implements PlayerPlugin {
  name = "RequiredIfValidationProvider";

  apply(player: Player) {
    player.hooks.validationController.tap(this.name, (validationController) => {
      validationController.hooks.createValidatorRegistry.tap(
        this.name,
        (validationRegistry) => {
          validationRegistry.register("requiredIf", requiredIf);
        },
      );
    });
  }
}
