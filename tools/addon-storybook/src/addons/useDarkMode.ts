export function useDarkMode() {
  if (typeof window === "undefined") {
    return false;
  }

  return matchMedia("(prefers-color-scheme: dark)").matches;
}
