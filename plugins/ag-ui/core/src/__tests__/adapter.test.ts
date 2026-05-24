import { describe, expect, it } from "vitest";
import { buildSessionFlow } from "../session/adapter";
import {
  SESSION_FLOW_ID,
  SURFACE_SEED_PREFIX,
  TRANSCRIPT_SEED_PREFIX,
} from "../session/types";

describe("buildSessionFlow", () => {
  it("produces a single VIEW with transcript + surface async seeds and an input bar", () => {
    const flow = buildSessionFlow("thread-abc");
    expect(flow.id).toBe(SESSION_FLOW_ID);
    expect(flow.views).toHaveLength(1);

    const view = flow.views?.[0] as Record<string, unknown> & {
      transcript: {
        asset: { values: Array<{ asset: Record<string, unknown> }> };
      };
      surface: { asset: Record<string, unknown> };
      input: { asset: { type: string } };
    };
    expect(view.type).toBe("agui-session");

    const transcriptSeed = view.transcript.asset.values[0].asset;
    expect(transcriptSeed.async).toBe(true);
    expect(transcriptSeed.flatten).toBe(true);
    expect(transcriptSeed.id.startsWith(TRANSCRIPT_SEED_PREFIX)).toBe(true);

    const surfaceSeed = view.surface.asset;
    expect(surfaceSeed.async).toBe(true);
    expect(surfaceSeed.id.startsWith(SURFACE_SEED_PREFIX)).toBe(true);

    expect(view.input.asset.type).toBe("agui-input-bar");

    expect((flow.data as { agui: { threadId: string } }).agui.threadId).toBe(
      "thread-abc",
    );
  });

  it("uses null threadId when none is supplied", () => {
    const flow = buildSessionFlow();
    expect((flow.data as { agui: { threadId: unknown } }).agui.threadId).toBe(
      null,
    );
  });
});
