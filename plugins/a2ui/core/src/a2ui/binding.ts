/**
 * JSON Pointer (RFC 6901) -> Player dot-notation binding string.
 *
 * A2UI uses absolute paths (`/user/firstName`) for the data model. Player
 * bindings use dot notation with array indexing (`user.firstName`,
 * `items[0].name`). Relative pointers (no leading slash) appear inside
 * templated children and resolve against the iteration scope; they translate
 * the same way (segments joined with dots, numeric segments become array
 * indexing).
 */

const NUMERIC_SEGMENT = /^(0|[1-9]\d*)$/;

/** Decode a single JSON Pointer segment (RFC 6901 escapes ~1 and ~0). */
const decodeSegment = (segment: string): string =>
  segment.replace(/~1/g, "/").replace(/~0/g, "~");

/**
 * Convert a JSON Pointer to a Player binding string.
 *
 * @example
 *   pointerToBinding("/user/firstName") -> "user.firstName"
 *   pointerToBinding("/items/0/name")   -> "items[0].name"
 *   pointerToBinding("firstName")       -> "firstName"     // relative
 *   pointerToBinding("/")               -> ""              // data root
 *   pointerToBinding("")                -> ""
 */
export function pointerToBinding(pointer: string): string {
  if (!pointer || pointer === "/") return "";

  const absolute = pointer.startsWith("/");
  const raw = absolute ? pointer.slice(1) : pointer;

  const segments = raw.split("/").map(decodeSegment);

  let out = "";
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (NUMERIC_SEGMENT.test(seg)) {
      out += `[${seg}]`;
    } else {
      out += i === 0 ? seg : `.${seg}`;
    }
  }
  return out;
}

/**
 * Convert a binding back to dot-segment array form (for schema synthesis).
 * "user.address.zip" -> ["user", "address", "zip"]
 * "items[0].name"    -> ["items", "[0]", "name"]   (array segments kept intact)
 *
 * Used by schema synthesis to walk path segments and build nested type defs.
 * Array indices are preserved as bracketed segments so the caller can detect
 * and handle them (or skip them, since Player's schema doesn't index into
 * specific array elements).
 */
export function bindingToSegments(binding: string): string[] {
  if (!binding) return [];
  const segments: string[] = [];
  const parts = binding.split(".");
  for (const part of parts) {
    const match = part.match(/^([^[]+)((?:\[\d+\])*)$/);
    if (!match) {
      segments.push(part);
      continue;
    }
    const [, name, arrays] = match;
    if (name) segments.push(name);
    if (arrays) {
      const arrayMatches = arrays.match(/\[\d+\]/g) ?? [];
      segments.push(...arrayMatches);
    }
  }
  return segments;
}

/**
 * Replace every `${/json/pointer}` (or `${relative}`) interpolation in a string
 * with the Player template form `{{dot.notation}}`.
 *
 * Used by the `formatString` translation in dynamic.ts. The `${...}` syntax is
 * specific to A2UI's formatString function; outside formatString, paths are
 * always wrapped in `{path: ...}` objects, not embedded in strings.
 */
export function interpolatePointers(input: string): string {
  return input.replace(/\$\{([^}]+)\}/g, (_, pointer) => {
    return `{{${pointerToBinding(pointer)}}}`;
  });
}
