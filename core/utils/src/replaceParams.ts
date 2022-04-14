const ANY_CHAR_REGEX = /%([a-zA-Z]+)/g;

/**
 * Replaces %num in message with the provided parameters in order.
 *
 * @param message - Parameterized string like "This is a %1"
 * @param params - Parameters to replace in message E.g. ['tax2021.amount']
 * @returns A message with the parameters replaced.
 */
export function replaceParams(
  message: string,
  params: Record<string, any>
): string {
  return message
    .slice()
    .replace(ANY_CHAR_REGEX, (keyExpr) => params[keyExpr.slice(1)] || keyExpr);
}
