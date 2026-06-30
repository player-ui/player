import { test, expect, vitest } from "vitest";
import { Player } from "@player-ui/player";
import { ContextPlugin } from "../plugin";
import { ContextPluginSymbol } from "../symbols";
import { defineContextKey } from "../key";
import { getContextPlugin } from "../utils";

const minimalFlow = {
  id: "flow-alpha",
  views: [{ id: "view-1", type: "info" }],
  navigation: {
    BEGIN: "FLOW_1",
    FLOW_1: {
      startState: "VIEW_1",
      VIEW_1: {
        ref: "view-1",
        state_type: "VIEW",
        transitions: { "*": "END_Done" },
      },
      END_Done: { state_type: "END", outcome: "done" },
    },
  },
};

test("findPlugin returns the registered ContextPlugin via its symbol", () => {
  const plugin = new ContextPlugin();
  const player = new Player({ plugins: [plugin] });
  expect(player.findPlugin<ContextPlugin>(ContextPluginSymbol)).toBe(plugin);
});

test("set / get / has round-trip", () => {
  const plugin = new ContextPlugin();
  new Player({ plugins: [plugin] });
  const key = defineContextKey<string>("greeting", "Greeting string");

  expect(plugin.has(key)).toBe(false);
  plugin.set(key, "hello");
  expect(plugin.get(key)).toBe("hello");
  expect(plugin.has(key)).toBe(true);
});

test("transform aggregates from other context entries on get", () => {
  const plugin = new ContextPlugin();
  new Player({ plugins: [plugin] });

  const first = defineContextKey<string>("first", "First name");
  const last = defineContextKey<string>("last", "Last name");
  const full = defineContextKey<string>("full", "Full name");

  plugin.set(first, "Ada");
  plugin.set(last, "Lovelace");
  plugin.registerTransform(full, {
    sources: [first, last],
    compute: (read) => `${read(first) ?? ""} ${read(last) ?? ""}`.trim(),
  });

  expect(plugin.get(full)).toBe("Ada Lovelace");
});

test("literal value takes precedence over registered transform", () => {
  const plugin = new ContextPlugin();
  new Player({ plugins: [plugin] });
  const src = defineContextKey<number>("src", "Source");
  const target = defineContextKey<number>("target", "Target");

  plugin.set(src, 10);
  const compute = vitest.fn().mockReturnValue(999);
  plugin.registerTransform(target, { sources: [src], compute });
  expect(plugin.get(target)).toBe(999);

  plugin.set(target, 5);
  compute.mockClear();
  expect(plugin.get(target)).toBe(5);
  expect(compute).not.toHaveBeenCalled();
});

test("per-key subscriber fires on direct set", () => {
  const plugin = new ContextPlugin();
  new Player({ plugins: [plugin] });
  const key = defineContextKey<number>("c", "Counter");
  const handler = vitest.fn();

  plugin.subscribe(key, handler);
  plugin.set(key, 1);
  plugin.set(key, 2);

  expect(handler).toHaveBeenCalledTimes(2);
  expect(handler).toHaveBeenNthCalledWith(1, 1, key);
  expect(handler).toHaveBeenNthCalledWith(2, 2, key);
});

test("subscriber on transform target fires when a source updates", () => {
  const plugin = new ContextPlugin();
  new Player({ plugins: [plugin] });
  const src = defineContextKey<number>("src", "Source");
  const target = defineContextKey<number>("target", "Target");

  plugin.registerTransform(target, {
    sources: [src],
    compute: (read) => (read(src) ?? 0) + 1,
  });
  const handler = vitest.fn();
  plugin.subscribe(target, handler);

  plugin.set(src, 41);
  expect(handler).toHaveBeenCalledTimes(1);
  expect(handler).toHaveBeenCalledWith(42, target);
});

test("subscribeAll receives every literal set and every dependent invalidation", () => {
  const plugin = new ContextPlugin();
  new Player({ plugins: [plugin] });
  const src = defineContextKey<number>("src", "Source");
  const target = defineContextKey<number>("target", "Target");

  plugin.registerTransform(target, {
    sources: [src],
    compute: (read) => (read(src) ?? 0) * 2,
  });
  const handler = vitest.fn();
  plugin.subscribeAll(handler);

  plugin.set(src, 3);
  expect(handler).toHaveBeenCalledTimes(2);
  expect(handler).toHaveBeenNthCalledWith(1, 3, src);
  expect(handler).toHaveBeenNthCalledWith(2, 6, target);
});

test("unsubscribe stops a per-key handler", () => {
  const plugin = new ContextPlugin();
  new Player({ plugins: [plugin] });
  const key = defineContextKey<number>("k", "K");
  const handler = vitest.fn();

  const token = plugin.subscribe(key, handler);
  plugin.set(key, 1);
  plugin.unsubscribe(token);
  plugin.set(key, 2);

  expect(handler).toHaveBeenCalledTimes(1);
});

test("unsubscribe stops a global handler", () => {
  const plugin = new ContextPlugin();
  new Player({ plugins: [plugin] });
  const key = defineContextKey<number>("k", "K");
  const handler = vitest.fn();

  const token = plugin.subscribeAll(handler);
  plugin.set(key, 1);
  plugin.unsubscribe(token);
  plugin.set(key, 2);

  expect(handler).toHaveBeenCalledTimes(1);
});

test("two ContextPlugin instances share state via singleton aliasing", () => {
  const a = new ContextPlugin();
  const b = new ContextPlugin();
  new Player({ plugins: [a, b] });
  const key = defineContextKey<string>("shared", "Shared");

  a.set(key, "from-a");
  expect(b.get(key)).toBe("from-a");
});

test("flow end freezes the store, pushes to history, then rotates", () => {
  const plugin = new ContextPlugin();
  const player = new Player({ plugins: [plugin] });
  const key = defineContextKey<string>("phase", "Phase");

  player.start(minimalFlow as any);
  plugin.set(key, "active");
  expect(plugin.get(key)).toBe("active");

  player.hooks.onEnd.call();

  expect(plugin.history()).toHaveLength(1);
  const snapshot = plugin.history()[0];
  expect(snapshot.flowId).toBe("flow-alpha");
  expect(snapshot.entries.map((e) => e.value)).toEqual(["active"]);
  expect(Object.isFrozen(snapshot)).toBe(true);

  expect(plugin.has(key)).toBe(false);
  expect(plugin.get(key)).toBeUndefined();
});

test("transforms and subscribers persist across flow rotation", () => {
  const plugin = new ContextPlugin();
  const player = new Player({ plugins: [plugin] });
  const src = defineContextKey<number>("src", "Source");
  const target = defineContextKey<number>("target", "Target");

  plugin.registerTransform(target, {
    sources: [src],
    compute: (read) => (read(src) ?? 0) + 100,
  });
  const handler = vitest.fn();
  plugin.subscribe(target, handler);

  player.start(minimalFlow as any);
  plugin.set(src, 1);
  player.hooks.onEnd.call();

  player.start(minimalFlow as any);
  plugin.set(src, 2);

  expect(handler).toHaveBeenCalledTimes(2);
  expect(handler).toHaveBeenNthCalledWith(1, 101, target);
  expect(handler).toHaveBeenNthCalledWith(2, 102, target);
});

test("re-registering a transform for the same key silently replaces", () => {
  const plugin = new ContextPlugin();
  new Player({ plugins: [plugin] });
  const target = defineContextKey<string>("t", "T");

  plugin.registerTransform(target, { sources: [], compute: () => "v1" });
  plugin.registerTransform(target, { sources: [], compute: () => "v2" });

  expect(plugin.get(target)).toBe("v2");
});

test("list exposes registered descriptors with hasValue / hasTransform flags", () => {
  const plugin = new ContextPlugin();
  new Player({ plugins: [plugin] });
  const literal = defineContextKey<number>("lit", "Literal");
  const derived = defineContextKey<number>("der", "Derived");

  plugin.set(literal, 1);
  plugin.registerTransform(derived, { sources: [], compute: () => 2 });

  const items = plugin.list();
  const byDesc = Object.fromEntries(items.map((d) => [d.description, d]));
  expect(byDesc.Literal).toMatchObject({ hasValue: true, hasTransform: false });
  expect(byDesc.Derived).toMatchObject({
    hasValue: false,
    hasTransform: true,
  });
});

test("name-based bridge API round-trips set/get/has/subscribe", () => {
  const plugin = new ContextPlugin();
  new Player({ plugins: [plugin] });

  expect(plugin.hasByName("formState")).toBe(false);
  plugin.setByName("formState", "Current form state", { name: "Ada" });
  expect(plugin.getByName("formState")).toEqual({ name: "Ada" });
  expect(plugin.hasByName("formState")).toBe(true);

  const handler = vitest.fn();
  plugin.subscribeByName("counter", "A counter", handler);
  plugin.setByName("counter", "A counter", 7);

  expect(handler).toHaveBeenCalledWith(7, "counter");
});

test("subscribeAllByName surfaces the resolved key name and description", () => {
  const plugin = new ContextPlugin();
  new Player({ plugins: [plugin] });

  const handler = vitest.fn();
  plugin.subscribeAllByName(handler);

  plugin.setByName("flag", "A flag", true);

  expect(handler).toHaveBeenCalledWith(true, "flag", "A flag");
});

test("a function-valued context entry round-trips through get and is callable", () => {
  const plugin = new ContextPlugin();
  new Player({ plugins: [plugin] });

  const addKey = defineContextKey<(a: number, b: number) => number>(
    "math.add",
    "Add two numbers",
  );

  expect(plugin.has(addKey)).toBe(false);
  plugin.set(addKey, (a, b) => a + b);
  expect(plugin.has(addKey)).toBe(true);
  expect(plugin.get(addKey)!(2, 3)).toBe(5);
});

test("setting a function entry twice replaces the prior implementation", () => {
  const plugin = new ContextPlugin();
  new Player({ plugins: [plugin] });
  const key = defineContextKey<() => string>("greet", "Greet");

  plugin.set(key, () => "v1");
  plugin.set(key, () => "v2");
  expect(plugin.get(key)!()).toBe("v2");
});

test("function entries appear in list() like any other entry", () => {
  const plugin = new ContextPlugin();
  new Player({ plugins: [plugin] });
  const a = defineContextKey<() => void>("a", "Action A");
  const b = defineContextKey<() => void>("b", "Action B");

  plugin.set(a, () => undefined);
  plugin.set(b, () => undefined);

  const descriptions = plugin.list().map((d) => d.description);
  expect(descriptions).toEqual(
    expect.arrayContaining(["Action A", "Action B"]),
  );
});

test("getByName resolves a function entry so native consumers can invoke it", () => {
  const plugin = new ContextPlugin();
  new Player({ plugins: [plugin] });
  const key = defineContextKey<(msg: string) => string>(
    "echo",
    "Echo the input",
  );
  plugin.set(key, (msg) => `said: ${msg}`);

  const echo = plugin.getByName("echo") as (msg: string) => string;
  expect(echo("hello")).toBe("said: hello");
});

test("singleton aliasing shares function entries across ContextPlugin instances", () => {
  const a = new ContextPlugin();
  const b = new ContextPlugin();
  new Player({ plugins: [a, b] });
  const key = defineContextKey<() => string>("shared", "Shared");

  a.set(key, () => "from-a");
  expect(b.get(key)!()).toBe("from-a");
});

test("flow-end freeze replaces a function entry with a throwing tombstone", () => {
  const plugin = new ContextPlugin();
  const player = new Player({ plugins: [plugin] });
  const actionKey = defineContextKey<() => string>("do.thing", "Do the thing");

  player.start(minimalFlow as any);
  plugin.set(actionKey, () => "live");
  expect(plugin.get(actionKey)!()).toBe("live");

  // End the flow so the active store is frozen into a history snapshot.
  player.hooks.onEnd.call();

  const [snapshot] = plugin.history();
  // Read the frozen entry by key — the same typed access as live context.
  const frozen = snapshot.get(actionKey);
  // The capability is preserved (still callable) but poisoned post-flow.
  expect(typeof frozen).toBe("function");
  expect(() => frozen!()).toThrowError(/no longer valid/);
});

test("snapshot.get returns undefined for a key absent when frozen", () => {
  const plugin = new ContextPlugin();
  const player = new Player({ plugins: [plugin] });
  const present = defineContextKey<string>("present", "Present");
  const absent = defineContextKey<string>("absent", "Absent");

  player.start(minimalFlow as any);
  plugin.set(present, "here");
  player.hooks.onEnd.call();

  const [snapshot] = plugin.history();
  expect(snapshot.get(present)).toBe("here");
  expect(snapshot.get(absent)).toBeUndefined();
});

test("getContextPlugin returns the existing plugin or registers a new one", () => {
  const existing = new ContextPlugin();
  const player = new Player({ plugins: [existing] });
  expect(getContextPlugin(player)).toBe(existing);

  const fresh = new Player();
  const created = getContextPlugin(fresh);
  expect(fresh.findPlugin<ContextPlugin>(ContextPluginSymbol)).toBe(created);
});
