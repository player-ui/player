import type { Flow } from "@player-ui/types";
import {
  AGUI_ERROR_PATH,
  AGUI_INPUT_VALUE_PATH,
  AGUI_IS_RUNNING_PATH,
  AGUI_RUN_ID_PATH,
  AGUI_THREAD_ID_PATH,
  SESSION_FLOW_ID,
  SURFACE_SEED_PREFIX,
  TRANSCRIPT_SEED_PREFIX,
} from "./types";

/**
 * Build the synthetic Flow that hosts an AG-UI session. The flow has a single
 * VIEW whose root is an `agui-session` asset with two regions:
 *
 *  - `transcript`: a single async-node seed. Each event re-invokes the parked
 *    callback with the accumulated bubble list. The transcript holds every
 *    kind of turn — assistant text, reasoning, tool calls, **and** A2UI
 *    surface bubbles (so forms appear inline in the conversation rather than
 *    in a sidebar).
 *  - `input`: a static `agui-input-bar` asset bound to `agui.inputValue`
 *    whose action calls the `agui_send` expression.
 *
 * Data model bootstrap covers session metadata + namespaces for streamed text
 * (`agui.messages.<id>.content`) and surface bubble state
 * (`agui.surfaces.<bubbleId>.submitted` / `.summary`).
 */
export function buildSessionFlow(threadId?: string): Flow {
  const transcriptSeedId = `${TRANSCRIPT_SEED_PREFIX}-0`;

  return {
    id: SESSION_FLOW_ID,
    data: {
      agui: {
        isRunning: false,
        threadId: threadId ?? null,
        runId: null,
        state: {},
        messages: {},
        surfaces: {},
        error: null,
        inputValue: "",
      },
    },
    schema: {
      ROOT: {
        agui: {
          type: "AGUIType",
        },
      },
      AGUIType: {
        isRunning: { type: "BooleanType" },
        threadId: { type: "StringType" },
        runId: { type: "StringType" },
        error: { type: "StringType" },
        inputValue: { type: "StringType" },
      },
    },
    views: [
      {
        id: SESSION_FLOW_ID,
        type: "agui-session",
        transcript: {
          asset: {
            id: "agui-transcript",
            type: "agui-transcript",
            // The seed sits directly in the parent's values list (no wrapper)
            // with `flatten: true`. Resolutions return arrays of asset
            // wrappers + a fresh trailing seed; the flatten splice extends
            // the values list each turn, and the trailing seed parks the
            // next callback. Linked-list streaming.
            values: [
              {
                async: true,
                flatten: true,
                id: transcriptSeedId,
              },
            ],
          },
        },
        input: {
          asset: {
            id: "agui-input",
            type: "agui-input-bar",
            value: `{{${AGUI_INPUT_VALUE_PATH}}}`,
            isRunning: `{{${AGUI_IS_RUNNING_PATH}}}`,
            error: `{{${AGUI_ERROR_PATH}}}`,
            runId: `{{${AGUI_RUN_ID_PATH}}}`,
            threadId: `{{${AGUI_THREAD_ID_PATH}}}`,
            inputBinding: AGUI_INPUT_VALUE_PATH,
          },
        },
      },
    ],
    navigation: {
      BEGIN: "FLOW_1",
      FLOW_1: {
        startState: "VIEW_1",
        VIEW_1: {
          state_type: "VIEW",
          ref: SESSION_FLOW_ID,
          transitions: {
            "*": "END_Done",
          },
        },
        END_Done: {
          state_type: "END",
          outcome: "done",
        },
      },
    } as Flow["navigation"],
  };
}

export function nextTranscriptSeedId(index: number): string {
  return `${TRANSCRIPT_SEED_PREFIX}-${index}`;
}

export function nextSurfaceSeedId(index: number): string {
  // Retained for back-compat; the session no longer renders a separate surface
  // slot — A2UI snapshots now arrive inline as transcript bubbles.
  return `${SURFACE_SEED_PREFIX}-${index}`;
}
