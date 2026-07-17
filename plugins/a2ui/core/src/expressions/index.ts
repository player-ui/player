import type { ExpressionHandler } from "@player-ui/player";
import { email, length, numeric, regex, required } from "./validation";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatString,
  pluralize,
} from "./format";
import { openUrl } from "./action";
import { and, not, or } from "./logic";

export * from "./validation";
export * from "./format";
export * from "./action";
export * from "./logic";

/**
 * Standard A2UI v0.9.1 expression functions. Names match the catalog spec
 * verbatim — the adapter emits `@[<name>(...)]@` with no namespace prefix.
 */
export const a2uiExpressions: Record<string, ExpressionHandler<any[], any>> = {
  required,
  regex,
  length,
  numeric,
  email,
  formatString,
  formatNumber,
  formatCurrency,
  formatDate,
  pluralize,
  openUrl,
  and,
  or,
  not,
};
