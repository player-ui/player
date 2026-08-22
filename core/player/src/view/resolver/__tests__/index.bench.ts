import { bench, describe, vi } from "vitest";
import { BindingInstance, BindingParser } from "../../../binding";
import { ViewInstance } from "../../view";
import {
  ApplicabilityPlugin,
  AssetPlugin,
  MultiNodePlugin,
  StringResolverPlugin,
} from "../../plugins";
import { Resolve } from "../types";

const createAsset = (depth: number, id: string, binding: string): any => {
  if (depth <= 0) {
    return undefined;
  }

  const newId = `${id}-${depth}`;
  const newBinding = `${binding}.${depth}`;

  return {
    asset: {
      id: newId,
      type: "asset-type",
      binding: `{{${newBinding}}}`,
      value: createAsset(depth - 1, newId, newBinding),
    },
  };
};

const createAST = (depth: number, breadth: number) => ({
  id: "view",
  type: "view-type",
  binding: "{{binding}}",
  values: Array.from({ length: breadth }, (_, idx) =>
    createAsset(depth, `asset-${idx}`, `binding.${idx}`),
  ),
});

/** A single node with {{breadth}} sibling child assets — a wide (vs deep) tree. */
const createWideAST = (breadth: number) => {
  const view: any = { id: "view", type: "view-type" };
  for (let i = 0; i < breadth; i++) {
    view[`field${i}`] = {
      asset: { id: `f-${i}`, type: "asset-type", binding: `{{binding.${i}}}` },
    };
  }
  return view;
};
const getOptions = (): Resolve.ResolverOptions => ({
  evaluator: {} as any,
  model: {
    delete: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
  },
  parseBinding: new BindingParser().parse,
  schema: {} as any,
});

/** creates a view with values containing {{breadth}} number of assets, each with nested assets {{depth}} deep */
const setupView = (
  depth: number,
  breadth: number,
  options: Resolve.ResolverOptions = getOptions(),
) => {
  const view = new ViewInstance(createAST(depth, breadth), options);

  new AssetPlugin().apply(view);
  new ApplicabilityPlugin().apply(view);
  new StringResolverPlugin().apply(view);
  new MultiNodePlugin().apply(view);
  view.update();

  return view;
};

/** Sets up a single wide node whose children all fold into one resolved value */
const setupWideView = (
  breadth: number,
  options: Resolve.ResolverOptions = getOptions(),
) => {
  const view = new ViewInstance(createWideAST(breadth), options);

  new AssetPlugin().apply(view);
  new ApplicabilityPlugin().apply(view);
  new StringResolverPlugin().apply(view);
  new MultiNodePlugin().apply(view);
  view.update();

  return view;
};

describe("resolver benchmarks", () => {
  let view: ViewInstance;
  let bindingChanges: Set<BindingInstance>;

  /** Test the time it takes to resolve a view for the first time. */
  bench(
    `initial resolve`,
    () => {
      view.update();
    },
    {
      setup: () => {
        view = setupView(10, 10, getOptions());
      },
      throws: true,
    },
  );

  /** Test the time it takes to update a view that has received no changes. */
  bench(
    `Resolving from cache`,
    () => {
      view.update(bindingChanges);
    },
    {
      setup: () => {
        view = setupView(10, 10, getOptions());
        bindingChanges = new Set();
      },
    },
  );

  /** Test the time it takes to update a view with some changes for more nested assets. */
  bench(
    `data changes`,
    () => {
      view.update(bindingChanges);
    },
    {
      setup: () => {
        const options = getOptions();
        view = setupView(10, 10, options);

        const { parseBinding } = options;
        bindingChanges = new Set([
          parseBinding("binding.9.10.9.8.7"),
          parseBinding("binding.9.10.9"),
          parseBinding("binding.9.10.9.8.7.6.5"),
          parseBinding("binding.9.10.9.8"),
          parseBinding("binding.9.10"),
          parseBinding("binding.9.10.9.8.7.6.5.4.3.2"),
        ]);
      },
      throws: true,
    },
  );

  /** Test the time it takes to update a view if the data changes require the whole view to update. */
  bench(
    `data changes slow`,
    () => {
      view.update(bindingChanges);
    },
    {
      setup: () => {
        const options = getOptions();
        view = setupView(10, 10, options);

        const { parseBinding } = options;
        bindingChanges = new Set([
          parseBinding("binding.9"),
          parseBinding("binding.8"),
          parseBinding("binding.7"),
          parseBinding("binding.6"),
          parseBinding("binding.5"),
          parseBinding("binding.4"),
          parseBinding("binding"),
        ]);
      },
      throws: true,
    },
  );
});

describe("resolver wide-node benchmarks", () => {
  let view: ViewInstance;
  let bindingChanges: Set<BindingInstance>;

  /** Many sibling children fold into one resolved value (the COW fast path). */
  bench(
    `initial resolve (wide: 50 children)`,
    () => {
      view.update();
    },
    {
      setup: () => {
        view = setupWideView(50);
      },
      throws: true,
    },
  );

  /** A single bound change forces the wide node to re-fold its children. */
  bench(
    `data change on wide node (50 children)`,
    () => {
      view.update(bindingChanges);
    },
    {
      setup: () => {
        const options = getOptions();
        view = setupWideView(50, options);
        bindingChanges = new Set([options.parseBinding("binding.25")]);
      },
      throws: true,
    },
  );
});
