import type { ExpressionHandler } from "@player-ui/player";

/** Opens a URL in a new tab/window. No-op outside a browser environment. */
export const openUrl: ExpressionHandler<[unknown, string?], void> = (
  _ctx,
  url,
  target,
) => {
  if (typeof window === "undefined" || !url) return;
  window.open(String(url), target ?? "_blank", "noopener,noreferrer");
};
