import { describe, expect, it, vi } from "vitest";
import {
  applyMutation,
  createApplierState,
  type MutationApplierDeps,
} from "../session/mutation-applier";
import { AGUI_IS_RUNNING_PATH, AGUI_MESSAGES_PATH } from "../session/types";

function makeDeps(): MutationApplierDeps & {
  setData: ReturnType<typeof vi.fn>;
  getData: ReturnType<typeof vi.fn>;
  data: Map<string, unknown>;
} {
  const data = new Map<string, unknown>();
  const setData = vi.fn((path: string, value: unknown) => {
    if (value === undefined) data.delete(path);
    else data.set(path, value);
  });
  const getData = vi.fn((path: string) => data.get(path));
  return {
    state: createApplierState(),
    setData,
    getData,
    data,
  };
}

describe("mutation applier", () => {
  it("appendTranscript flushes pending assets and trails a fresh seed", () => {
    const deps = makeDeps();
    const callback = vi.fn();
    deps.state.transcript.callback = callback;

    applyMutation(
      {
        kind: "appendTranscript",
        asset: { id: "a", type: "agui-text-message" } as never,
      },
      deps,
    );

    expect(callback).toHaveBeenCalledTimes(1);
    const call = callback.mock.calls[0]?.[0] as Array<Record<string, unknown>>;
    expect(Array.isArray(call)).toBe(true);
    expect(call).toHaveLength(2);
    expect((call[0] as { asset?: { id: string } }).asset?.id).toBe("a");
    // Trailing entry is the next async seed in the chain.
    expect(call[1]).toMatchObject({ async: true, flatten: true });
    // Callback is detached after firing — the next seed will park its own.
    expect(deps.state.transcript.callback).toBeUndefined();
    expect(deps.state.transcript.emittedCount).toBe(1);
  });

  it("appendTranscript buffers when no callback is parked", () => {
    const deps = makeDeps();
    applyMutation(
      {
        kind: "appendTranscript",
        asset: { id: "a", type: "agui-text-message" } as never,
      },
      deps,
    );
    expect(deps.state.transcript.assets).toHaveLength(1);
    expect(deps.state.transcript.emittedCount).toBe(0);
  });

  it("streamTextDelta appends to the existing message content", () => {
    const deps = makeDeps();
    deps.data.set(`${AGUI_MESSAGES_PATH}.m1.content`, "Hello");
    applyMutation(
      { kind: "streamTextDelta", messageId: "m1", delta: " world" },
      deps,
    );
    expect(deps.setData).toHaveBeenCalledWith(
      `${AGUI_MESSAGES_PATH}.m1.content`,
      "Hello world",
    );
  });

  it("streamTextDelta handles missing prior value as empty string", () => {
    const deps = makeDeps();
    applyMutation(
      { kind: "streamTextDelta", messageId: "m1", delta: "first" },
      deps,
    );
    expect(deps.setData).toHaveBeenCalledWith(
      `${AGUI_MESSAGES_PATH}.m1.content`,
      "first",
    );
  });

  it("setSurface re-invokes the parked callback with the inner asset shape", () => {
    const deps = makeDeps();
    const callback = vi.fn();
    deps.state.surface.callback = callback;
    applyMutation(
      {
        kind: "setSurface",
        asset: { id: "form-1", type: "Column" } as never,
      },
      deps,
    );
    expect(callback).toHaveBeenCalledWith({ id: "form-1", type: "Column" });
  });

  it("setStatus writes the running flag", () => {
    const deps = makeDeps();
    applyMutation({ kind: "setStatus", status: "running" }, deps);
    expect(deps.setData).toHaveBeenCalledWith(AGUI_IS_RUNNING_PATH, true);
    applyMutation({ kind: "setStatus", status: "idle" }, deps);
    expect(deps.setData).toHaveBeenLastCalledWith(AGUI_IS_RUNNING_PATH, false);
  });

  it("applyStateDelta translates JSON Pointer paths to data bindings", () => {
    const deps = makeDeps();
    applyMutation(
      {
        kind: "applyStateDelta",
        patches: [
          { op: "replace", path: "/count", value: 5 },
          { op: "add", path: "/items/0", value: "first" },
        ],
      },
      deps,
    );
    expect(deps.setData).toHaveBeenCalledWith("agui.state.count", 5);
    expect(deps.setData).toHaveBeenCalledWith("agui.state.items.0", "first");
  });

  it("applyStateDelta skips unsupported ops", () => {
    const deps = makeDeps();
    applyMutation(
      {
        kind: "applyStateDelta",
        patches: [{ op: "move", path: "/a", value: "x" }],
      },
      { ...deps, logger: { warn: vi.fn() } as never },
    );
    expect(deps.setData).not.toHaveBeenCalled();
  });
});
