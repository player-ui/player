export const DOCS_BASE_URL = "https://player-ui.github.io/";
export const BASE_PREFIX: string | undefined =
  process.env.NODE_ENV === "production" ? "DOCS_BASE_PATH" : undefined;
