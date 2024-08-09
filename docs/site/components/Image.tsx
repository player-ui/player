import path from "path-browserify";
import { BASE_PREFIX } from "../config/constants";

export function withBasePrefix(location?: string): string | undefined {
  if (!location) {
    return location;
  }

  if (BASE_PREFIX) {
    return path.join("/", BASE_PREFIX, location);
  }

  return location;
}
