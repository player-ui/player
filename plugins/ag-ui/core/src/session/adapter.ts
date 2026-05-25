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
 * Build the synthetic Flow that hosts an AG-UI session. The flow contains a
 * single VIEW whose root is an `agui-session` asset with three regions:
 *
 *  - `transcript`: a single async-node seed. Each event re-invokes the parked
 *    callback with the full `agui-transcript` asset (whose `values` contains
 *    the accumulated bubble list). React diffing handles bubble add/remove.
 *  - `surface`: a single async-node that hosts the latest A2UI snapshot. Each
 *    new snapshot re-invokes the callback with `{ asset: <A2UI tree> }`.
 *  - `input`: a static `agui-input-bar` asset bound to `agui.inputValue`
 *    whose action calls the `agui_send` expression.
 *
 * Data model bootstrap covers session metadata + a placeholder for streamed
 * text bubble bindings (`agui.messages.<id>.content`).
 */
export function buildSessionFlow(threadId?: string): Flow {
  const transcriptSeedId = `${TRANSCRIPT_SEED_PREFIX}-0`;
  const surfaceSeedId = `${SURFACE_SEED_PREFIX}-0`;

  return {
    id: SESSION_FLOW_ID,
    data: {
      agui: {
        isRunning: false,
        threadId: threadId ?? null,
        runId: null,
        state: {},
        messages: {},
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
            async: true,
            id: transcriptSeedId,
            type: "agui-transcript-seed",
          },
        },
        surface: {
          asset: {
            async: true,
            id: surfaceSeedId,
            type: "agui-surface-seed",
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
  return `${SURFACE_SEED_PREFIX}-${index}`;
}
