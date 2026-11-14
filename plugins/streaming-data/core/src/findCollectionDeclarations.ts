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

/** Player's parsed schema marks the items of an array entry with `[]` and of a record with `{}` */
const isInsideArrayOrRecord = (binding: string): boolean =>
  binding.split(".").some((segment) => segment === "[]" || segment === "{}");

/**
 * Every schema entry with a `source`, read from the schema Player parsed for the flow
 * (`SchemaController.schema`, keyed by binding). A collection can't sit inside an array or
 * record entry.
 */
export function findCollectionDeclarations(
  parsedSchema: ReadonlyMap<string, unknown>,
): {
  declarations: CollectionDeclaration[];
  problems: DeclarationProblem[];
} {
  const declarations: CollectionDeclaration[] = [];
  const problems: DeclarationProblem[] = [];

  parsedSchema.forEach((dataType, binding) => {
    if (!isPlainObject(dataType) || dataType.source === undefined) return;
    const { source } = dataType;

    if (isInsideArrayOrRecord(binding)) {
      problems.push({
        binding,
        problem: "a collection can't sit inside an array or record",
      });
    } else if (isSourceDeclaration(source)) {
      declarations.push({ binding, source });
    } else {
      problems.push({ binding, problem: sourceProblem(source) ?? "" });
    }
  });

  return { declarations, problems };
}
