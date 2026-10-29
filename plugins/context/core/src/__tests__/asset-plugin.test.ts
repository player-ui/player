import { describe, test, expect, vitest } from "vitest";
import { Player } from "@player-ui/player";
import type { InProgressState } from "@player-ui/player";
import { ReferenceAssetsPlugin } from "@player-ui/reference-assets-plugin";
import { ContextPlugin } from "../plugin";
import { defineAssetContext, prop } from "../asset-descriptor";
import type { AssetContext } from "../asset-descriptor";
import {
  AssetContextPlugin,
  assetContextKey,
  getAssetContextPlugin,
  viewAllAssetsContextKey,
  viewAssetIdsContextKey,
  viewAssetsContextKey,
} from "../asset-plugin";
import type { AssetContextRegistration } from "../asset-plugin";
import { AssetContextPluginSymbol } from "../symbols";

const textContext = defineAssetContext({ fields: { value: "value" } });

const inputContext = defineAssetContext({
  fields: {
    binding: "binding",
    value: "value",
    label: "label.asset.value",
    // Function-valued: never published.
    set: "set",
  },
});

const actionContext = defineAssetContext({
  fields: { value: "value", label: "label.asset.value", run: "run" },
});

const collectionContext = defineAssetContext({
  fields: { label: "label.asset.value" },
  children: ["values"],
});

const baseRegistrations: AssetContextRegistration[] = [
  [{ type: "text" }, textContext],
  [{ type: "input" }, inputContext],
  [{ type: "action" }, actionContext],
  [{ type: "collection" }, collectionContext],
];

const text = (id: string, value: string) => ({
  asset: { id, type: "text", value },
});

const input = (id: string, binding: string, label: string) => ({
  asset: { id, type: "input", binding, label: text(`${id}-label`, label) },
});

/** A single-view flow (plus an optional second view) around the given view. */
const makeFlow = (
  view: Record<string, unknown>,
  data: Record<string, unknown> = {},
  nextView?: Record<string, unknown>,
) => ({
  id: "flow-assets",
  views: nextView ? [view, nextView] : [view],
  data,
  navigation: {
    BEGIN: "FLOW_1",
    FLOW_1: {
      startState: "VIEW_1",
      VIEW_1: {
        ref: view.id,
        state_type: "VIEW",
        transitions: nextView ? { "*": "VIEW_2" } : { "*": "END_Done" },
      },
      ...(nextView && {
        VIEW_2: {
          ref: nextView.id,
          state_type: "VIEW",
          transitions: { "*": "END_Done" },
        },
      }),
      END_Done: { state_type: "END", outcome: "done" },
    },
  },
});

const profileView = {
  id: "profile",
  type: "collection",
  label: text("profile-label", "Profile"),
  values: [
    input("name-input", "data.name", "Name"),
    input("email-input", "data.email", "Email"),
  ],
};

const profileData = { data: { name: "Ada", email: "ada@example.com" } };

const setup = (registrations: AssetContextRegistration[]) => {
  const ctx = new ContextPlugin();
  const player = new Player({
    plugins: [
      ctx,
      new ReferenceAssetsPlugin(),
      new AssetContextPlugin(registrations),
    ],
  });
  return { ctx, player };
};

const dataController = (player: Player) =>
  (player.getState() as InProgressState).controllers.data;

const transition = (player: Player) =>
  (player.getState() as InProgressState).controllers.flow.transition("Next");

const ids = (entries: ReadonlyArray<AssetContext> | undefined) =>
  (entries ?? []).map((entry) => entry.id);

describe("registration", () => {
  test("publishes an entry for each described asset as it resolves", () => {
    const { ctx, player } = setup(baseRegistrations);
    player.start(makeFlow(profileView, profileData) as any);

    expect(ctx.get(assetContextKey("name-input"))).toEqual({
      id: "name-input",
      type: "input",
      binding: "data.name",
      value: "Ada",
      label: "Name",
    });
    expect(ctx.get(assetContextKey("profile"))).toEqual({
      id: "profile",
      type: "collection",
      label: "Profile",
      children: { values: ["name-input", "email-input"] },
    });
    expect(ctx.get(viewAssetIdsContextKey)).toEqual(
      expect.arrayContaining(["name-input", "email-input", "profile"]),
    );
  });

  test("ignores assets without a descriptor", () => {
    const { ctx, player } = setup([[{ type: "input" }, inputContext]]);
    player.start(makeFlow(profileView, profileData) as any);

    expect(ids(ctx.get(viewAllAssetsContextKey))).toEqual([
      "name-input",
      "email-input",
    ]);
    expect(ctx.has(assetContextKey("profile-label"))).toBe(false);
  });

  test("never publishes function-valued fields", () => {
    const { ctx, player } = setup(baseRegistrations);
    player.start(
      makeFlow({
        id: "view-1",
        type: "collection",
        values: [
          {
            asset: {
              id: "next",
              type: "action",
              value: "Next",
              label: text("next-label", "Continue"),
            },
          },
        ],
      }) as any,
    );

    expect(ctx.get(assetContextKey("next"))).toEqual({
      id: "next",
      type: "action",
      value: "Next",
      label: "Continue",
    });
    expect(ctx.get(assetContextKey("name-input"))).toBeUndefined();
  });

  test("rewrites an entry only when its own data changes", async () => {
    const { ctx, player } = setup(baseRegistrations);
    player.start(makeFlow(profileView, profileData) as any);

    const onName = vitest.fn();
    const onEmail = vitest.fn();
    ctx.subscribe(assetContextKey("name-input"), onName);
    ctx.subscribe(assetContextKey("email-input"), onEmail);

    dataController(player).set([["data.name", "Grace"]]);

    // View updates are applied on a microtask.
    await vitest.waitFor(() => expect(onName).toHaveBeenCalled());
    expect(ctx.get(assetContextKey("name-input"))?.value).toBe("Grace");
    expect(onEmail).not.toHaveBeenCalled();
  });

  test("resets the asset set on each new view", () => {
    const { ctx, player } = setup(baseRegistrations);
    player.start(
      makeFlow(profileView, profileData, {
        id: "done",
        type: "collection",
        values: [text("thanks", "Thanks")],
      }) as any,
    );

    transition(player);

    expect(ids(ctx.get(viewAssetsContextKey))).toEqual(["thanks", "done"]);
  });

  test("the most specific match wins", () => {
    const backContext = defineAssetContext({
      fields: { value: "value", role: prop("metaData.role") },
    });
    const { ctx, player } = setup([
      ...baseRegistrations,
      [{ type: "action", metaData: { role: "back" } }, backContext],
    ]);
    player.start(
      makeFlow({
        id: "view-1",
        type: "collection",
        values: [
          { asset: { id: "next", type: "action", value: "Next" } },
          {
            asset: {
              id: "back",
              type: "action",
              value: "Prev",
              metaData: { role: "back" },
            },
          },
        ],
      }) as any,
    );

    expect(ctx.get(assetContextKey("next"))).toEqual({
      id: "next",
      type: "action",
      value: "Next",
    });
    expect(ctx.get(assetContextKey("back"))).toEqual({
      id: "back",
      type: "action",
      value: "Prev",
      role: "back",
    });
  });

  test("merges registrations from several callers into one instance", () => {
    const first = new AssetContextPlugin([[{ type: "input" }, inputContext]]);
    const second = new AssetContextPlugin([[{ type: "text" }, textContext]]);
    const ctx = new ContextPlugin();
    const player = new Player({
      plugins: [ctx, new ReferenceAssetsPlugin(), first, second],
    });
    getAssetContextPlugin(player).register([
      [{ type: "collection" }, collectionContext],
    ]);

    expect(player.findPlugin(AssetContextPluginSymbol)).toBe(first);

    player.start(makeFlow(profileView, profileData) as any);

    expect(ctx.has(assetContextKey("name-input"))).toBe(true);
    expect(ctx.has(assetContextKey("profile-label"))).toBe(true);
    expect(ctx.has(assetContextKey("profile"))).toBe(true);
  });

  test("works when registered before the ContextPlugin", () => {
    const ctx = new ContextPlugin();
    const player = new Player({
      plugins: [
        new AssetContextPlugin(baseRegistrations),
        new ReferenceAssetsPlugin(),
        ctx,
      ],
    });
    player.start(makeFlow(profileView, profileData) as any);

    expect(ctx.get(assetContextKey("name-input"))?.value).toBe("Ada");
  });

  test("auto-registers a ContextPlugin when none is present", () => {
    const player = new Player({
      plugins: [
        new ReferenceAssetsPlugin(),
        new AssetContextPlugin(baseRegistrations),
      ],
    });
    player.start(makeFlow(profileView, profileData) as any);

    const ctx = player.findPlugin<ContextPlugin>(ContextPlugin.Symbol);
    expect(ctx?.get(assetContextKey("name-input"))?.value).toBe("Ada");
  });

  test("entries are readable by name for native consumers", () => {
    const { ctx, player } = setup(baseRegistrations);
    player.start(makeFlow(profileView, profileData) as any);

    expect(ctx.getByName("player.asset.name-input")).toEqual(
      ctx.get(assetContextKey("name-input")),
    );
    expect(ctx.getByName("player.view.assets")).toEqual(
      ctx.get(viewAssetsContextKey),
    );
  });

  test("literal entries drop when the flow ends", () => {
    const { ctx, player } = setup(baseRegistrations);
    player.start(makeFlow(profileView, profileData) as any);
    player.hooks.onEnd.call();

    expect(ctx.get(assetContextKey("name-input"))).toBeUndefined();
    expect(ctx.get(viewAssetsContextKey)).toEqual([]);
    expect(ctx.history()[0]?.get(assetContextKey("name-input"))?.value).toBe(
      "Ada",
    );
  });
});

describe("collation", () => {
  const collatingCollection = (
    options: Record<string, unknown> = {},
  ): AssetContextRegistration => [
    { type: "collection" },
    defineAssetContext({
      fields: { label: "label.asset.value" },
      collate: [{ slot: "values", as: "items", ...options }],
    }),
  ];

  const nestedView = {
    id: "settings",
    type: "collection",
    label: text("settings-label", "Settings"),
    values: [
      {
        asset: {
          id: "contact",
          type: "collection",
          label: text("contact-label", "Contact"),
          values: [input("email-input", "data.email", "Email")],
        },
      },
      input("name-input", "data.name", "Name"),
    ],
  };

  test("embeds the whole described subtree by default", () => {
    const { ctx, player } = setup([
      [{ type: "input" }, inputContext],
      [{ type: "collection", id: "contact" }, collectionContext],
      collatingCollection(),
    ]);
    player.start(makeFlow(nestedView, profileData) as any);

    expect(ctx.get(assetContextKey("settings"))).toEqual({
      id: "settings",
      type: "collection",
      label: "Settings",
      items: [
        {
          id: "contact",
          type: "collection",
          label: "Contact",
          children: {
            values: [
              {
                id: "email-input",
                type: "input",
                binding: "data.email",
                value: "ada@example.com",
                label: "Email",
              },
            ],
          },
        },
        {
          id: "name-input",
          type: "input",
          binding: "data.name",
          value: "Ada",
          label: "Name",
        },
      ],
    });
  });

  test("depth: 1 embeds only the nearest described descendants", () => {
    const { ctx, player } = setup([
      [{ type: "input" }, inputContext],
      [{ type: "collection", id: "contact" }, collectionContext],
      collatingCollection({ depth: 1 }),
    ]);
    player.start(makeFlow(nestedView, profileData) as any);

    const [contact] = ctx.get(assetContextKey("settings"))
      ?.items as AssetContext[];
    expect(contact?.children).toEqual({ values: ["email-input"] });
    // Only the embedded level is hidden; deeper assets stay top-level.
    expect(ids(ctx.get(viewAssetsContextKey))).toEqual([
      "email-input",
      "settings",
    ]);
  });

  test("walks through assets without a descriptor", () => {
    const { ctx, player } = setup([
      [{ type: "input" }, inputContext],
      collatingCollection(),
    ]);
    player.start(
      makeFlow(
        {
          id: "view-1",
          type: "collection",
          values: [
            // `group` has no descriptor; its input is collated directly.
            {
              asset: {
                id: "group",
                type: "group",
                content: input("name-input", "data.name", "Name"),
              },
            },
          ],
        },
        profileData,
      ) as any,
    );

    expect(ids(ctx.get(assetContextKey("view-1"))?.items as any)).toEqual([
      "name-input",
    ]);
  });

  test("hides collated descendants from the top-level list by default", () => {
    const { ctx, player } = setup([
      [{ type: "input" }, inputContext],
      collatingCollection(),
    ]);
    player.start(makeFlow(profileView, profileData) as any);

    expect(ids(ctx.get(viewAssetsContextKey))).toEqual(["profile"]);
    expect(ids(ctx.get(viewAllAssetsContextKey))).toEqual([
      "name-input",
      "email-input",
      "profile",
    ]);
    // Still readable by id.
    expect(ctx.get(assetContextKey("email-input"))?.value).toBe(
      "ada@example.com",
    );
  });

  test("hide: false keeps descendants in the top-level list", () => {
    const { ctx, player } = setup([
      [{ type: "input" }, inputContext],
      collatingCollection({ hide: false }),
    ]);
    player.start(makeFlow(profileView, profileData) as any);

    expect(ids(ctx.get(viewAssetsContextKey))).toEqual([
      "name-input",
      "email-input",
      "profile",
    ]);
  });

  test("the parent updates when a child changes", async () => {
    const { ctx, player } = setup([
      [{ type: "input" }, inputContext],
      collatingCollection(),
    ]);
    player.start(makeFlow(profileView, profileData) as any);

    const onParent = vitest.fn();
    ctx.subscribe(assetContextKey("profile"), onParent);

    dataController(player).set([["data.email", "grace@example.com"]]);

    await vitest.waitFor(() => expect(onParent).toHaveBeenCalled());
    const items = ctx.get(assetContextKey("profile"))?.items as AssetContext[];
    expect(items[1]?.value).toBe("grace@example.com");
  });

  test("reduce summarizes instead of embedding", () => {
    const { ctx, player } = setup([
      [{ type: "input" }, inputContext],
      collatingCollection({
        as: "summary",
        reduce: (entries: ReadonlyArray<AssetContext>) =>
          entries.map((entry) => entry.value).join(", "),
      }),
    ]);
    player.start(makeFlow(profileView, profileData) as any);

    expect(ctx.get(assetContextKey("profile"))).toEqual({
      id: "profile",
      type: "collection",
      label: "Profile",
      summary: "Ada, ada@example.com",
    });
  });

  test("nested collators compose", () => {
    const { ctx, player } = setup([
      [{ type: "input" }, inputContext],
      collatingCollection(),
    ]);
    player.start(makeFlow(nestedView, profileData) as any);

    const [contact] = ctx.get(assetContextKey("settings"))
      ?.items as AssetContext[];
    expect(contact?.id).toBe("contact");
    expect(ids(contact?.items as AssetContext[])).toEqual(["email-input"]);
    expect(ids(ctx.get(viewAssetsContextKey))).toEqual(["settings"]);
  });
});
