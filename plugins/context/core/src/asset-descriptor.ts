import type { Asset } from "@player-ui/player";

/**
 * A single asset's published context entry. `id` and `type` are always
 * present; every other key comes from the asset's descriptor.
 */
export type AssetContext = {
  /** The asset's id. */
  id: string;
  /** The asset's type. */
  type: string;
  /**
   * Nested assets, keyed by the slot they were found in. Ids when the
   * descriptor declares `children`; full entries when an ancestor collates
   * this asset and expands its descendants.
   */
  children?: Record<
    string,
    ReadonlyArray<string> | ReadonlyArray<AssetContext>
  >;
  [key: string]: unknown;
};

/** Pulls a single value off a resolved asset. */
export type AssetContextExtractor<T = Asset> = (asset: T) => unknown;

/**
 * A field definition: either a dot-separated property path on the resolved
 * asset (e.g. `"value"`, `"metaData.role"`) or an extractor function.
 */
export type AssetContextField<T = Asset> = string | AssetContextExtractor<T>;

/** A slot path under an asset: a dot-separated string or path segments. */
export type AssetSlot = string | ReadonlyArray<string>;

/** Options for rolling a parent's nested assets up into its own entry. */
export type CollateOptions = {
  /** Where to look for nested assets under the parent. */
  slot: AssetSlot;
  /** Output key on the parent entry. Defaults to the slot name. */
  as?: string;
  /**
   * How many levels of described descendants to embed. `1` embeds only the
   * nearest described descendants. Defaults to `"all"`.
   */
  depth?: number | "all";
  /**
   * Omit collated descendants from the view-level list of top-level assets.
   * They remain readable by id. Defaults to `true`.
   */
  hide?: boolean;
  /** Summarize the collated entries instead of embedding them. */
  reduce?: (entries: ReadonlyArray<AssetContext>) => unknown;
};

/**
 * A collation spec: a slot path shorthand for `{ slot }` with every other
 * option defaulted, or full {@link CollateOptions}.
 */
export type CollateSpec = string | CollateOptions;

/**
 * Declares which resolved properties of an asset are published as context.
 */
export type AssetContextDescriptor<T = Asset> = {
  /** Output key -> property path or extractor. */
  fields?: Record<string, AssetContextField<T>>;
  /** Slots whose nested asset ids are recorded under `children`. */
  children?: ReadonlyArray<AssetSlot>;
  /** Slots whose nested assets are rolled up into this asset's entry. */
  collate?: ReadonlyArray<CollateSpec>;
  /** Escape hatch for anything that isn't a straight pick. Merged last. */
  extract?: (asset: T) => Record<string, unknown> | undefined;
};

/** Options for {@link toAssetContext} and {@link findNestedAssets}. */
export type NestedAssetOptions = {
  /**
   * Whether a nested asset counts as a child. Assets that don't count are
   * walked through to their own nested assets. Defaults to counting every
   * asset.
   */
  isDescribed?: (asset: Asset) => boolean;
};

/**
 * Identity helper that types a descriptor against an asset shape.
 */
export const defineAssetContext = <T = Asset>(
  descriptor: AssetContextDescriptor<T>,
): AssetContextDescriptor<T> => descriptor;

const toSegments = (path: AssetSlot): ReadonlyArray<string> =>
  typeof path === "string" ? path.split(".") : path;

/** The display name of a slot path, used as an output key. */
export const slotName = (path: AssetSlot): string =>
  typeof path === "string" ? path : path.join(".");

/** Read a (dot-separated) property path off a value. */
export const getPath = (value: unknown, path: AssetSlot): unknown => {
  let current: unknown = value;
  for (const segment of toSegments(path)) {
    if (current === null || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
};

/** Extractor that reads a property path off the asset. */
export const prop =
  <T = Asset>(path: AssetSlot): AssetContextExtractor<T> =>
  (asset) =>
    getPath(asset, path);

/** Extractor that always returns the same value. */
export const constant =
  <T = Asset>(value: unknown): AssetContextExtractor<T> =>
  () =>
    value;

const isPublishable = (value: unknown): boolean =>
  value !== undefined && typeof value !== "function";

/**
 * Resolve a set of field definitions against a source object. `undefined` and
 * function values are skipped, so callables never reach the context store.
 */
export const pickFields = <T>(
  source: T,
  fields: Record<string, AssetContextField<T>>,
): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(fields)) {
    const value =
      typeof field === "function" ? field(source) : getPath(source, field);
    if (isPublishable(value)) {
      out[key] = value;
    }
  }
  return out;
};

/**
 * Extractor that maps every item of an array property through its own field
 * definitions. Returns `undefined` when the property isn't an array.
 */
export const each =
  <T = Asset, Item = any>(
    path: AssetSlot,
    fields: Record<string, AssetContextField<Item>>,
  ): AssetContextExtractor<T> =>
  (asset) => {
    const items = getPath(asset, path);
    if (!Array.isArray(items)) {
      return undefined;
    }
    return items.map((item: Item) => pickFields(item, fields));
  };

const isAsset = (value: unknown): value is Asset =>
  value !== null &&
  typeof value === "object" &&
  typeof (value as Asset).id === "string" &&
  typeof (value as Asset).type === "string";

const isAssetWrapper = (value: unknown): value is { asset: Asset } =>
  value !== null &&
  typeof value === "object" &&
  isAsset((value as { asset?: unknown }).asset);

/**
 * Collect the nearest nested assets under a resolved value, in document
 * order. Asset wrappers (`{ asset }`) are found at any depth inside plain
 * objects and arrays. When an asset doesn't satisfy `isDescribed`, the walk
 * continues into it to find its own nested assets instead.
 */
export const findNestedAssets = (
  value: unknown,
  options: NestedAssetOptions = {},
): Asset[] => {
  const { isDescribed } = options;
  const found: Asset[] = [];
  const seen = new Set<unknown>();

  const visit = (current: unknown) => {
    if (current === null || typeof current !== "object") {
      return;
    }
    if (seen.has(current)) {
      return;
    }
    seen.add(current);

    if (Array.isArray(current)) {
      current.forEach(visit);
      return;
    }

    if (isAssetWrapper(current)) {
      const { asset } = current;
      if (!isDescribed || isDescribed(asset)) {
        found.push(asset);
      } else {
        visitProperties(asset);
      }
      return;
    }

    visitProperties(current);
  };

  const visitProperties = (current: object) => {
    for (const key of Object.keys(current)) {
      visit((current as Record<string, unknown>)[key]);
    }
  };

  visit(value);
  return found;
};

/**
 * Group the nearest nested assets of a resolved asset by the top-level
 * property they were found under.
 */
export const findNestedAssetsBySlot = (
  asset: Asset,
  options: NestedAssetOptions = {},
): Record<string, Asset[]> => {
  const out: Record<string, Asset[]> = {};
  for (const key of Object.keys(asset)) {
    const nested = findNestedAssets(
      (asset as Record<string, unknown>)[key],
      options,
    );
    if (nested.length > 0) {
      out[key] = nested;
    }
  }
  return out;
};

/**
 * Build an asset's context entry from its descriptor. Pure: no Player or
 * store access.
 */
export const toAssetContext = <T extends Asset>(
  descriptor: AssetContextDescriptor<T>,
  asset: T,
  options: NestedAssetOptions = {},
): AssetContext => {
  const entry: AssetContext = {
    id: asset.id,
    type: asset.type,
    ...pickFields(asset, descriptor.fields ?? {}),
  };

  if (descriptor.children) {
    const children: Record<string, ReadonlyArray<string>> = {};
    for (const slot of descriptor.children) {
      const ids = findNestedAssets(getPath(asset, slot), options).map(
        (child) => child.id,
      );
      if (ids.length > 0) {
        children[slotName(slot)] = ids;
      }
    }
    if (Object.keys(children).length > 0) {
      entry.children = children;
    }
  }

  const extra = descriptor.extract?.(asset);
  if (extra) {
    for (const key of Object.keys(extra)) {
      if (isPublishable(extra[key])) {
        entry[key] = extra[key];
      }
    }
  }

  // `id` and `type` always reflect the asset itself.
  entry.id = asset.id;
  entry.type = asset.type;

  return entry;
};

/** Normalize a collation spec, applying defaults. */
export const toCollateOptions = (
  spec: CollateSpec,
): Required<Omit<CollateOptions, "reduce">> &
  Pick<CollateOptions, "reduce"> => {
  const options = typeof spec === "string" ? { slot: spec } : spec;
  return {
    slot: options.slot,
    as: options.as ?? slotName(options.slot),
    depth: options.depth ?? "all",
    hide: options.hide ?? true,
    reduce: options.reduce,
  };
};
