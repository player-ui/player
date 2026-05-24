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
  it("appendTranscript pushes assets and emits MultiNode via the parked callback", () => {
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
    applyMutation(
      {
        kind: "appendTranscript",
        asset: { id: "b", type: "agui-text-message" } as never,
      },
      deps,
    );

    expect(callback).toHaveBeenCalledTimes(2);
    const lastCall = callback.mock.calls[1][0] as { values: unknown[] };
    expect(lastCall.values).toHaveLength(2);
  });

  it("appendTranscript without a callback still records assets so a late subscriber replays them", () => {
    const deps = makeDeps();
    applyMutation(
      {
        kind: "appendTranscript",
        asset: { id: "a", type: "agui-text-message" } as never,
      },
      deps,
    );
    expect(deps.state.transcript.assets).toHaveLength(1);
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

  it("setSurface re-invokes the parked callback with the new asset", () => {
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
    expect(callback).toHaveBeenCalledWith({
      asset: { id: "form-1", type: "Column" },
    });
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
