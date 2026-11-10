import type {
  CollectionHandle,
  CommitRecordsRequest,
  RecordChanges,
  RecordUpdate,
} from "./types";

/** The data model and expression calls collecting changes needs */
export interface ChangeContext {
  get(binding: string): unknown;
  set(binding: string, value: unknown): void;
  delete(binding: string): void;
  evaluate(expression: string): unknown;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const keysAt = (
  context: ChangeContext,
  binding: string | undefined,
): string[] => {
  if (!binding) return [];
  const value = context.get(binding);
  const keys = Array.isArray(value) ? value : [value];
  return keys.filter(
    (key): key is string => typeof key === "string" && key !== "",
  );
};

/** The fields of `after` that differ from `record`; a field `after` dropped becomes null */
const changedFields = (
  record: object,
  after: Record<string, unknown>,
): Record<string, unknown> => {
  const before = new Map<string, unknown>(Object.entries(record));
  const patch: Record<string, unknown> = {};
  Object.keys(after).forEach((field) => {
    if (after[field] !== before.get(field)) patch[field] = after[field];
  });
  before.forEach((value, field) => {
    if (!(field in after) && value !== undefined && value !== null)
      patch[field] = null;
  });
  return patch;
};

/**
 * The changes a commit-records request asks for. Records come back from the data model untyped,
 * so they're treated as the collection's record type from here on; the source checks what it
 * sends.
 */
export function collectChanges<R extends object>(
  collection: CollectionHandle<R>,
  request: CommitRecordsRequest,
  context: ChangeContext,
): RecordChanges<R> {
  const changes: RecordChanges<R> = { create: [], update: [], remove: [] };
  const toUpdate = (
    key: string,
    record: R,
    after: Record<string, unknown>,
  ): void => {
    const patch = changedFields(record, after);
    if (Object.keys(patch).length === 0) return;
    const update: RecordUpdate<R> = {
      key,
      patch: patch as Partial<R>,
      record: { ...record, ...patch },
    };
    changes.update.push(update);
  };

  const { rowBinding, eachRow } = request;
  if (rowBinding && eachRow.length > 0) {
    keysAt(context, request.update).forEach((key) => {
      const record = collection.get(key);
      if (!record) return;
      context.set(rowBinding, record);
      eachRow.forEach((expression) => context.evaluate(expression));
      const after = context.get(rowBinding);
      if (isPlainObject(after)) toUpdate(key, record, after);
    });
    context.delete(rowBinding);
  }

  if (request.save) {
    const draft = context.get(request.save);
    if (isPlainObject(draft)) {
      const key = collection.key(draft as R);
      const record = key ? collection.get(key) : undefined;
      if (!key) changes.create.push(draft as R);
      else if (record) toUpdate(key, record, draft);
    }
  }

  changes.remove = keysAt(context, request.remove).filter(
    (key) => collection.indexOf(key) >= 0,
  );
  return changes;
}
