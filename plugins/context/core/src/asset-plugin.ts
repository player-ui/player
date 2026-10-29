import { NodeType } from "@player-ui/player";
import type { Asset, Player, PlayerPlugin } from "@player-ui/player";
import { Registry } from "@player-ui/partial-match-registry";
import { defineContextKey } from "./key";
import { AssetContextPluginSymbol } from "./symbols";
import { getContextPlugin } from "./utils";
import {
  findNestedAssets,
  getPath,
  pickFields,
  toAssetContext,
  toCollateOptions,
} from "./asset-descriptor";
import type {
  AssetContext,
  AssetContextDescriptor,
  CollateOptions,
  NestedAssetOptions,
} from "./asset-descriptor";
import type { ContextPlugin } from "./plugin";
import type { ContextKey, ContextReader } from "./types";

/**
 * A descriptor registration: a partial-match object (matched against the
 * asset, like asset transforms) and the descriptor to apply.
 */
export type AssetContextRegistration = [
  match: Record<string, unknown>,
  descriptor: AssetContextDescriptor<any>,
];

/** Context entry for a single asset, by id. */
export const assetContextKey = (id: string): ContextKey<AssetContext> =>
  defineContextKey<AssetContext>(
    `player.asset.${id}`,
    `Context for asset ${id}`,
  );

/**
 * An asset's own fields, before any collated descendants are merged in. Only
 * written for assets whose descriptor declares `collate`.
 */
export const assetSelfContextKey = (id: string): ContextKey<AssetContext> =>
  defineContextKey<AssetContext>(
    `player.asset.${id}.self`,
    `Own context for asset ${id}, before collation`,
  );

/** Ids of every described asset in the current view, in resolution order. */
export const viewAssetIdsContextKey: ContextKey<ReadonlyArray<string>> =
  defineContextKey<ReadonlyArray<string>>(
    "player.view.assetIds",
    "Ids of described assets in the current view",
  );

/** Ids of assets rolled up into an ancestor's entry and hidden from the top-level list. */
const collatedAssetIdsContextKey: ContextKey<ReadonlyArray<string>> =
  defineContextKey<ReadonlyArray<string>>(
    "player.view.assetIds.collated",
    "Ids of described assets collated into an ancestor",
  );

/**
 * Top-level asset entries for the current view. Assets collated into an
 * ancestor are nested inside that ancestor's entry instead of listed here.
 */
export const viewAssetsContextKey: ContextKey<ReadonlyArray<AssetContext>> =
  defineContextKey<ReadonlyArray<AssetContext>>(
    "player.view.assets",
    "Top-level asset context entries for the current view",
  );

/** Every asset entry for the current view, flat, including collated ones. */
export const viewAllAssetsContextKey: ContextKey<ReadonlyArray<AssetContext>> =
  defineContextKey<ReadonlyArray<AssetContext>>(
    "player.view.allAssets",
    "Every asset context entry for the current view",
  );

/**
 * The shape of a collated value, captured when the parent resolves and read
 * back live: described assets are leaves (by id), optionally expanded into
 * their own collated properties; lists and objects mirror the plain data
 * around them.
 */
type CollationNode =
  | {
      kind: "asset";
      id: string;
      children?: Record<string, CollationNode>;
    }
  | { kind: "list"; items: ReadonlyArray<CollationNode> }
  | {
      kind: "object";
      props: Record<string, CollationNode>;
      values: Record<string, unknown>;
    };

type ResolvedCollation = Pick<CollateOptions, "reduce"> & {
  as: string;
  hide: boolean;
  node?: CollationNode;
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

const isEmpty = (value: object): boolean => Object.keys(value).length === 0;

const isDefined = <T>(value: T | undefined): value is T => value !== undefined;

const sameIds = (
  a: ReadonlyArray<string> | undefined,
  b: ReadonlyArray<string>,
): boolean =>
  a !== undefined &&
  a.length === b.length &&
  a.every((id, index) => id === b[index]);

/** Ids of every asset in a resolved view, in document order. */
const collectAssetIds = (view: unknown): string[] => {
  const ids = new Set<string>();
  const visit = (asset: Asset) => {
    ids.add(asset.id);
    findNestedAssets(asset).forEach(visit);
  };
  // The view itself may not resolve to an asset (e.g. its id is an
  // expression that resolves to nothing); its nested assets still count.
  if (isAsset(view)) {
    ids.add(view.id);
  }
  findNestedAssets(view).forEach(visit);
  return Array.from(ids);
};

/** Ids of every asset in a collation node, at any depth. */
const flattenIds = (node: CollationNode): string[] => {
  switch (node.kind) {
    case "asset":
      return [
        node.id,
        ...Object.values(node.children ?? {}).flatMap(flattenIds),
      ];
    case "list":
      return node.items.flatMap(flattenIds);
    case "object":
      return Object.values(node.props).flatMap(flattenIds);
  }
};

/** The nearest asset nodes in a collation node, in document order. */
const nearestAssets = (node: CollationNode): CollationNode[] => {
  switch (node.kind) {
    case "asset":
      return [node];
    case "list":
      return node.items.flatMap(nearestAssets);
    case "object":
      return Object.values(node.props).flatMap(nearestAssets);
  }
};

const readProps = (
  props: Record<string, CollationNode>,
  read: ContextReader,
): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(props)) {
    const value = readCollationNode(child, read);
    if (value !== undefined) {
      out[key] = value;
    }
  }
  return out;
};

/** Read a collation node back from the store, embedding current entries. */
const readCollationNode = (
  node: CollationNode,
  read: ContextReader,
): unknown => {
  switch (node.kind) {
    case "asset": {
      const entry = read(assetContextKey(node.id));
      if (!entry || !node.children) {
        return entry;
      }
      return { ...entry, children: readProps(node.children, read) };
    }
    case "list":
      return node.items
        .map((item) => readCollationNode(item, read))
        .filter(isDefined);
    case "object": {
      const out = { ...readProps(node.props, read), ...node.values };
      return isEmpty(out) ? undefined : out;
    }
  }
};

/**
 * Publishes per-asset context for the current view. Asset types opt in with
 * an {@link AssetContextDescriptor}; whenever a described asset resolves, its
 * entry is written to the [[ContextPlugin]] store.
 *
 * Read-only over the render model: resolved assets are never modified.
 * Auto-registers a [[ContextPlugin]] if one isn't already on the player.
 */
export class AssetContextPlugin implements PlayerPlugin {
  name = "asset-context";

  static Symbol: symbol = AssetContextPluginSymbol;
  public readonly symbol: symbol = AssetContextPlugin.Symbol;

  private readonly registry = new Registry<AssetContextDescriptor<any>>();
  private readonly registrations: AssetContextRegistration[] = [];
  /** Set when another instance is already registered on the player. */
  private delegate?: AssetContextPlugin;

  constructor(registrations: ReadonlyArray<AssetContextRegistration> = []) {
    this.register(registrations);
  }

  /**
   * Add descriptors. Can be called at any time, by any plugin; more specific
   * matches take precedence over less specific ones.
   */
  register(registrations: ReadonlyArray<AssetContextRegistration>): void {
    if (this.delegate) {
      this.delegate.register(registrations);
      return;
    }

    registrations.forEach(([match, descriptor]) => {
      this.registry.set(match, descriptor);
      this.registrations.push([match, descriptor]);
    });
  }

  /** The descriptor that applies to the given asset, if any. */
  getDescriptor(asset: unknown): AssetContextDescriptor<any> | undefined {
    if (this.delegate) {
      return this.delegate.getDescriptor(asset);
    }

    return this.registry.get(asset);
  }

  apply(player: Player) {
    const existing = player.findPlugin<AssetContextPlugin>(
      AssetContextPluginSymbol,
    );
    if (existing !== undefined && existing !== this) {
      existing.register(this.registrations);
      this.delegate = existing;
      return;
    }

    const ctx = getContextPlugin(player);
    const nestedOptions: NestedAssetOptions = {
      isDescribed: (asset) => this.getDescriptor(asset) !== undefined,
    };

    let assetIds: ReadonlyArray<string> = [];
    /** collated asset id -> id of the ancestor it's hidden under */
    const collatedBy = new Map<string, string>();
    /** id -> whether it was published as a collating asset, for this view */
    const published = new Map<string, boolean>();
    /** The last resolved view the published ids were synced against. */
    let lastSynced: unknown;

    const publishAssetIds = (ids: ReadonlyArray<string>) => {
      assetIds = ids;
      this.registerViewAggregations(ctx, ids);
      ctx.set(viewAssetIdsContextKey, ids);
    };

    const publishCollated = () => {
      const ids = Array.from(collatedBy.keys());
      if (!sameIds(ctx.get(collatedAssetIdsContextKey), ids)) {
        ctx.set(collatedAssetIdsContextKey, ids);
      }
    };

    /** Clear the entry of an asset that's no longer in the view. */
    const clearAsset = (id: string) => {
      // A collating asset's entry is a transform over its own fields.
      const key = published.get(id)
        ? assetSelfContextKey(id)
        : assetContextKey(id);
      published.delete(id);
      collatedBy.delete(id);
      collatedBy.forEach((parentId, childId) => {
        if (parentId === id) {
          collatedBy.delete(childId);
        }
      });
      // Skip keys the store no longer holds, e.g. after a flow rotation.
      if (ctx.get(key) !== undefined) {
        ctx.set(key, undefined);
      }
    };

    /**
     * Reconcile published entries with the resolved view: assets removed
     * from the tree (e.g. no longer applicable) are cleared, and the id list
     * follows document order.
     */
    const syncView = (view: unknown) => {
      if (view === lastSynced) {
        return;
      }
      lastSynced = view;

      const ids = collectAssetIds(view).filter((id) => published.has(id));
      const present = new Set(ids);
      const removed = Array.from(published.keys()).filter(
        (id) => !present.has(id),
      );

      if (!sameIds(assetIds, ids)) {
        publishAssetIds(ids);
      }
      removed.forEach(clearAsset);
      publishCollated();
    };

    const resetView = () => {
      Array.from(published.keys()).forEach(clearAsset);
      lastSynced = undefined;
      collatedBy.clear();
      ctx.set(collatedAssetIdsContextKey, []);
      publishAssetIds([]);
    };

    /**
     * A described asset's node, expanding its own properties until
     * `maxDepth`. A descendant with its own `collate` is not expanded: its
     * entry already carries its rolled-up descendants.
     */
    const toAssetNode = (
      asset: Asset,
      maxDepth: number,
      level: number,
    ): CollationNode => {
      const node: CollationNode = { kind: "asset", id: asset.id };
      if (level >= maxDepth || this.getDescriptor(asset)?.collate?.length) {
        return node;
      }

      const children: Record<string, CollationNode> = {};
      for (const [key, value] of Object.entries(asset)) {
        const child = toCollationNode(value, maxDepth, level + 1);
        if (child) {
          children[key] = child;
        }
      }
      if (!isEmpty(children)) {
        node.children = children;
      }

      return node;
    };

    /**
     * Mirror a resolved value as a collation node, keeping only the branches
     * that lead to described assets (or to picked `fields`). Returns
     * `undefined` when there's nothing to collate.
     */
    const toCollationNode = (
      value: unknown,
      maxDepth: number,
      level: number,
      fields?: CollateOptions["fields"],
    ): CollationNode | undefined => {
      if (isAssetWrapper(value)) {
        const { asset } = value;
        if (nestedOptions.isDescribed?.(asset)) {
          return toAssetNode(asset, maxDepth, level);
        }

        // Undescribed assets are transparent: their nearest described
        // descendants stand in for them.
        const items = findNestedAssets(asset, nestedOptions).map((nested) =>
          toAssetNode(nested, maxDepth, level),
        );
        return items.length > 0 ? { kind: "list", items } : undefined;
      }

      if (Array.isArray(value)) {
        const items = value.flatMap((item: unknown) => {
          const node = toCollationNode(item, maxDepth, level, fields);
          if (!node) {
            return [];
          }
          // Splice a transparent asset's descendants into the list.
          return node.kind === "list" && isAssetWrapper(item)
            ? node.items
            : [node];
        });
        return items.length > 0 ? { kind: "list", items } : undefined;
      }

      if (value === null || typeof value !== "object") {
        return undefined;
      }

      const props: Record<string, CollationNode> = {};
      for (const [key, child] of Object.entries(value)) {
        const node = toCollationNode(child, maxDepth, level);
        if (node) {
          props[key] = node;
        }
      }
      const values = fields ? pickFields(value, fields) : {};
      return isEmpty(props) && isEmpty(values)
        ? undefined
        : { kind: "object", props, values };
    };

    const publishCollatedAsset = (
      asset: Asset,
      descriptor: AssetContextDescriptor<any>,
      entry: AssetContext,
    ) => {
      const { id } = asset;
      const collations: ResolvedCollation[] = (descriptor.collate ?? []).map(
        (spec) => {
          const options = toCollateOptions(spec);
          const maxDepth =
            options.depth === "all" ? Infinity : Math.max(1, options.depth);
          const node = toCollationNode(
            getPath(asset, options.slot),
            maxDepth,
            1,
            options.fields,
          );

          return {
            as: options.as,
            hide: options.hide,
            reduce: options.reduce,
            node,
          };
        },
      );

      // Re-derive which ids this asset hides: its descendants may have changed.
      collatedBy.forEach((parentId, childId) => {
        if (parentId === id) {
          collatedBy.delete(childId);
        }
      });
      const idsOf = (collation: ResolvedCollation) =>
        collation.node ? flattenIds(collation.node) : [];
      collations
        .filter((collation) => collation.hide)
        .forEach((collation) =>
          idsOf(collation).forEach((childId) => collatedBy.set(childId, id)),
        );

      const selfKey = assetSelfContextKey(id);
      const descendantIds = collations.flatMap(idsOf);

      // A transform keeps this entry live: if only a descendant re-resolves,
      // the descendant's key changes and this entry recomputes from it.
      ctx.registerTransform<AssetContext>(assetContextKey(id), {
        sources: [selfKey, ...descendantIds.map(assetContextKey)],
        compute: (read) => {
          const self = read(selfKey);
          // Transforms outlive a flow; without this flow's own fields there's
          // nothing to publish.
          if (!self) {
            return undefined;
          }

          const out: AssetContext = { ...self };
          for (const { node, reduce, as } of collations) {
            let value: unknown;
            if (reduce) {
              const entries = (node ? nearestAssets(node) : [])
                .map((asset) => readCollationNode(asset, read))
                .filter(isDefined) as AssetContext[];
              value = reduce(entries);
            } else if (node) {
              value = readCollationNode(node, read);
            }
            if (value !== undefined && typeof value !== "function") {
              out[as] = value;
            }
          }
          return out;
        },
      });

      ctx.set(selfKey, entry);
      publishCollated();
    };

    const publishAsset = (
      asset: Asset,
      descriptor: AssetContextDescriptor<any>,
    ) => {
      const entry = toAssetContext(descriptor, asset, nestedOptions);
      const collates = Boolean(descriptor.collate?.length);

      if (collates) {
        publishCollatedAsset(asset, descriptor, entry);
      } else {
        ctx.set(assetContextKey(asset.id), entry);
      }

      // The view-level id list is rebuilt once the whole update resolves.
      published.set(asset.id, collates);
    };

    this.registerViewAggregations(ctx, []);

    player.hooks.viewController.tap(this.name, (viewController) => {
      viewController.hooks.view.tap(this.name, (view) => {
        // Each view starts with an empty asset set.
        resetView();

        view.hooks.resolver.tap(this.name, (resolver) => {
          resolver.hooks.afterResolve.tap(this.name, (resolved, node) => {
            if (
              (node.type !== NodeType.Asset && node.type !== NodeType.View) ||
              !isAsset(resolved)
            ) {
              return resolved;
            }

            const descriptor = this.getDescriptor(node.value);
            if (descriptor) {
              publishAsset(resolved, descriptor);
            }

            return resolved;
          });

          resolver.hooks.afterUpdate.tap(this.name, syncView);
        });
      });
    });
  }

  /**
   * (Re-)register the view-level aggregations so their sources are exactly
   * the current asset ids: they recompute when the id set changes or one of
   * those assets' entries changes, and nothing else.
   */
  private registerViewAggregations(
    ctx: ContextPlugin,
    ids: ReadonlyArray<string>,
  ) {
    const sources = [
      viewAssetIdsContextKey,
      collatedAssetIdsContextKey,
      ...ids.map(assetContextKey),
    ];

    ctx.registerTransform<ReadonlyArray<AssetContext>>(
      viewAllAssetsContextKey,
      {
        sources,
        compute: (read) =>
          (read(viewAssetIdsContextKey) ?? [])
            .map((id) => read(assetContextKey(id)))
            .filter(isDefined),
      },
    );

    ctx.registerTransform<ReadonlyArray<AssetContext>>(viewAssetsContextKey, {
      sources,
      compute: (read) => {
        const collated = new Set(read(collatedAssetIdsContextKey) ?? []);
        return (read(viewAssetIdsContextKey) ?? [])
          .filter((id) => !collated.has(id))
          .map((id) => read(assetContextKey(id)))
          .filter(isDefined);
      },
    });
  }
}

/**
 * Returns the existing AssetContextPlugin or creates and registers a new one.
 */
export function getAssetContextPlugin(player: Player): AssetContextPlugin {
  const existing = player.findPlugin<AssetContextPlugin>(
    AssetContextPluginSymbol,
  );
  const plugin = existing ?? new AssetContextPlugin();

  if (!existing) {
    player.registerPlugin(plugin);
  }

  return plugin;
}
