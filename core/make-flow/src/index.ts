import type {
  Flow,
  Asset,
  AssetWrapper,
  NavigationFlow,
  NavigationFlowEndState,
} from "@player-ui/types";
import { identify, ObjType } from "./identify";

export * from "./identify";

interface JSend<T> {
  /** The status of the JSEND wrapper */
  status: string;
  /** The data we care about */
  data: T;
}

interface CollectionAsset extends Asset<"collection"> {
  /** The values of the collection. Used when there are an array of assets passed to the makeFlow fn */
  values: Array<AssetWrapper>;
}

/** Check an object for the JSEND wrapper and remove it if needed */
function unwrapJSend(obj: object) {
  const isJSend = "status" in obj && "data" in obj;

  if (isJSend) {
    return (obj as JSend<object>).data;
  }

  return obj;
}

interface NavOptions {
  /** An optional expression to run when this Flow starts */
  onStart?: NavigationFlow["onStart"];
  /** An optional expression to run when this Flow ends */
  onEnd?: NavigationFlow["onEnd"];
  /**
   * A description of _how_ the flow ended.
   * If this is a flow started from another flow, the outcome determines the flow transition
   */
  outcome?: NavigationFlowEndState["outcome"];
}

/**
 * create a default navigation if the flow was exactly one view and there is no navigation already
 */
const createDefaultNav = (flow: Flow, options?: NavOptions): Flow => {
  if (
    (flow.navigation === undefined || flow.navigation === null) &&
    Array.isArray(flow.views) &&
    flow.views.length === 1
  ) {
    const navFlow: NavigationFlow = {
      startState: "VIEW_0",
      VIEW_0: {
        state_type: "VIEW",
        ref: flow.views[0].id ?? `${flow.id}-views-0`,
        transitions: {
          "*": "END_done",
          Prev: "END_back",
        },
      },
      END_done: {
        state_type: "END",
        outcome: options?.outcome ?? "doneWithFlow",
      },
      END_back: {
        state_type: "END",
        outcome: "BACK",
      },
    };

    if (options?.onStart !== undefined) {
      navFlow.onStart = options.onStart;
    }

    if (options?.onEnd !== undefined) {
      navFlow.onEnd = options.onEnd;
    }

    return {
      ...flow,
      navigation: {
        BEGIN: "Flow",
        Flow: navFlow,
      },
    };
  }

  return flow;
};

/**
 * Take any given object and try to convert it to a flow
 */
export function makeFlow(obj: any, args?: NavOptions): Flow {
  const objified = unwrapJSend(typeof obj === "string" ? JSON.parse(obj) : obj);

  if (Array.isArray(objified)) {
    const collection: CollectionAsset = {
      id: "collection",
      type: "collection",
      values: objified.map((v) => {
        const type = identify(v);

        if (type === ObjType.ASSET) {
          return { asset: v };
        }

        return v;
      }),
    };

    return makeFlow(collection);
  }

  const type = identify(obj);

  if (type === ObjType.UNKNOWN) {
    throw new Error(
      "No clue how to convert this into a flow. Just do it yourself",
    );
  }

  if (type === ObjType.FLOW) {
    return createDefaultNav(obj, args);
  }

  if (type === ObjType.ASSET_WRAPPER) {
    return makeFlow(obj.asset);
  }

  return {
    id: "generated-flow",
    views: [obj],
    data: {},
    navigation: {
      BEGIN: "FLOW_1",
      FLOW_1: {
        startState: "VIEW_1",
        VIEW_1: {
          state_type: "VIEW",
          ref: obj.id,
          transitions: {
            "*": "END_Done",
          },
        },
        END_Done: {
          state_type: "END",
          outcome: "done",
        },
      },
    },
  };
}
