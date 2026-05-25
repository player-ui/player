import { describe, expect, it } from "vitest";
import { createRouterContext, route } from "../session/event-router";
import {
  AGUI_ERROR_PATH,
  AGUI_MESSAGES_PATH,
  AGUI_RUN_ID_PATH,
  AGUI_STATE_PATH,
  type AGUIEvent,
} from "../session/types";

describe("event-router.route", () => {
  it("RUN_STARTED resets error and toggles running", () => {
    const ctx = createRouterContext();
    const mutations = route(
      { type: "RUN_STARTED", runId: "r1" } as AGUIEvent,
      ctx,
    );
    expect(mutations).toEqual([
      { kind: "setStatus", status: "running" },
      { kind: "setData", path: AGUI_ERROR_PATH, value: null },
      { kind: "setData", path: AGUI_RUN_ID_PATH, value: "r1" },
    ]);
  });

  it("RUN_FINISHED returns idle", () => {
    const mutations = route(
      { type: "RUN_FINISHED" } as AGUIEvent,
      createRouterContext(),
    );
    expect(mutations).toEqual([{ kind: "setStatus", status: "idle" }]);
  });

  it("RUN_ERROR sets error status and writes the message", () => {
    const mutations = route(
      { type: "RUN_ERROR", message: "boom" } as AGUIEvent,
      createRouterContext(),
    );
    expect(mutations).toEqual([
      { kind: "setStatus", status: "error", message: "boom" },
      { kind: "setData", path: AGUI_ERROR_PATH, value: "boom" },
    ]);
  });

  it("TEXT_MESSAGE_START seeds an empty content binding + appends a bubble", () => {
    const ctx = createRouterContext();
    const mutations = route(
      {
        type: "TEXT_MESSAGE_START",
        messageId: "m1",
        role: "assistant",
      } as AGUIEvent,
      ctx,
    );
    expect(mutations).toHaveLength(2);
    expect(mutations[0]).toEqual({
      kind: "setData",
      path: `${AGUI_MESSAGES_PATH}.m1.content`,
      value: "",
    });
    expect(mutations[1]?.kind).toBe("appendTranscript");
    expect(ctx.startedMessageIds.has("m1")).toBe(true);
  });

  it("TEXT_MESSAGE_START is idempotent for the same id", () => {
    const ctx = createRouterContext();
    route({ type: "TEXT_MESSAGE_START", messageId: "m1" } as AGUIEvent, ctx);
    const second = route(
      { type: "TEXT_MESSAGE_START", messageId: "m1" } as AGUIEvent,
      ctx,
    );
    expect(second).toEqual([]);
  });

  it("TEXT_MESSAGE_CONTENT streams a delta", () => {
    const mutations = route(
      {
        type: "TEXT_MESSAGE_CONTENT",
        messageId: "m1",
        delta: "hi",
      } as AGUIEvent,
      createRouterContext(),
    );
    expect(mutations).toEqual([
      { kind: "streamTextDelta", messageId: "m1", delta: "hi" },
    ]);
  });

  it("CUSTOM event named 'a2ui' produces setSurface with the embedded asset", () => {
    const snapshot = {
      surfaceId: "s1",
      components: [{ id: "root", component: "Text", text: "hello" }],
    };
    const mutations = route(
      { type: "CUSTOM", name: "a2ui", value: snapshot } as AGUIEvent,
      createRouterContext(),
    );
    expect(mutations).toHaveLength(1);
    expect(mutations[0]?.kind).toBe("setSurface");
    if (mutations[0]?.kind === "setSurface") {
      expect(mutations[0].asset?.type).toBe("Text");
    }
  });

  it("CUSTOM event with a different name is a no-op", () => {
    const mutations = route(
      { type: "CUSTOM", name: "something-else", value: {} } as AGUIEvent,
      createRouterContext(),
    );
    expect(mutations).toEqual([]);
  });

  it("STATE_SNAPSHOT replaces the agui.state subtree", () => {
    const snap = { count: 3, history: ["a"] };
    const mutations = route(
      { type: "STATE_SNAPSHOT", snapshot: snap } as AGUIEvent,
      createRouterContext(),
    );
    expect(mutations).toEqual([
      { kind: "setData", path: AGUI_STATE_PATH, value: snap },
    ]);
  });

  it("STATE_DELTA hands patches off for RFC 6902 application", () => {
    const patches = [{ op: "replace", path: "/count", value: 5 }];
    const mutations = route(
      { type: "STATE_DELTA", delta: patches } as AGUIEvent,
      createRouterContext(),
    );
    expect(mutations).toEqual([{ kind: "applyStateDelta", patches }]);
  });

  it("TOOL_CALL_START is idempotent and seeds an empty args binding", () => {
    const ctx = createRouterContext();
    const first = route(
      {
        type: "TOOL_CALL_START",
        toolCallId: "t1",
        toolCallName: "search",
      } as AGUIEvent,
      ctx,
    );
    expect(first).toHaveLength(2);
    expect(first[0]).toEqual({
      kind: "setData",
      path: `${AGUI_MESSAGES_PATH}.t1.args.content`,
      value: "",
    });
    const second = route(
      {
        type: "TOOL_CALL_START",
        toolCallId: "t1",
        toolCallName: "search",
      } as AGUIEvent,
      ctx,
    );
    expect(second).toEqual([]);
  });

  it("TOOL_CALL_RESULT writes result to the messages namespace", () => {
    const mutations = route(
      {
        type: "TOOL_CALL_RESULT",
        toolCallId: "t1",
        content: { ok: true },
      } as AGUIEvent,
      createRouterContext(),
    );
    expect(mutations).toEqual([
      {
        kind: "setData",
        path: `${AGUI_MESSAGES_PATH}.t1.result`,
        value: { ok: true },
      },
    ]);
  });

  it("Unknown event types fall through to no-op", () => {
    const mutations = route(
      { type: "SOMETHING_NEW" } as unknown as AGUIEvent,
      createRouterContext(),
    );
    expect(mutations).toEqual([]);
  });
});
