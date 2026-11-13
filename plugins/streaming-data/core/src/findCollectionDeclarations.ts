import type { Schema } from "@player-ui/player";
import type { CollectionSourceDeclaration } from "./types";

export interface CollectionDeclaration {
  binding: string;
  source: CollectionSourceDeclaration;
}

export interface DeclarationProblem {
  binding: string;
  problem: string;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const sourceProblem = (source: unknown): string | undefined => {
  if (!isPlainObject(source)) return "`source` must be an object";
  if (typeof source.ref !== "string" || source.ref === "")
    return "`ref` must name a source";
  if (
    source.status !== undefined &&
    (typeof source.status !== "string" || source.status === "")
  ) {
    return "`status` must be a binding";
  }
  if (source.params !== undefined && !isPlainObject(source.params)) {
    return "`params` must be an object";
  }
  return undefined;
};

const isSourceDeclaration = (
  source: unknown,
): source is CollectionSourceDeclaration => sourceProblem(source) === undefined;

/**
 * Every schema entry with a `source`, found by walking the schema's types from ROOT. A collection
 * can't sit inside an array or record entry, so the walk doesn't descend into those.
 */
export function findCollectionDeclarations(schema: Schema.Schema | undefined): {
  declarations: CollectionDeclaration[];
  problems: DeclarationProblem[];
} {
  const declarations: CollectionDeclaration[] = [];
  const problems: DeclarationProblem[] = [];
  if (!schema?.ROOT) return { declarations, problems };

  const visit = (
    node: Schema.Node,
    path: string[],
    visited: ReadonlySet<string>,
  ): void => {
    Object.entries(node).forEach(([property, dataType]) => {
      const binding = [...path, property].join(".");
      const { source } = dataType;

      if (source !== undefined) {
        if (isSourceDeclaration(source)) {
          declarations.push({ binding, source });
        } else {
          problems.push({ binding, problem: sourceProblem(source) ?? "" });
        }
        return;
      }

      if ("isArray" in dataType && dataType.isArray) return;
      if ("isRecord" in dataType && dataType.isRecord) return;
      const child = schema[dataType.type];
      if (child && !visited.has(dataType.type)) {
        visit(child, [...path, property], new Set([...visited, dataType.type]));
      }
    });
  };

  visit(schema.ROOT, [], new Set(["ROOT"]));
  return { declarations, problems };
}
