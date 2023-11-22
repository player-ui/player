import React from "react";
import { ReactAsset, usePlayer } from "../..";
import type {
  ReactPlayer,
  ReactPlayerPlugin,
  Asset,
  AssetWrapper,
  Flow,
} from "../..";

interface SimpleAsset extends Asset<"simple"> {
  /** text value of the asset */
  value?: string;
}

/** basic aset */
const SimpleAsset = (props: SimpleAsset) => (
  <div id={props.id}>{props.value}</div>
);

interface ActionAsset extends Asset<"action"> {
  /** label of the action */
  label: string;

  /** value of the action */
  value: string;

  /** expression of the action */
  exp: string;
}

/** basic action asset */
const Action = (props: ActionAsset) => {
  const player = usePlayer();

  return (
    <button
      type="button"
      id={props.id}
      onClick={() => {
        const state = player?.getState();

        if (state?.status === "in-progress") {
          if (props.exp) {
            state.controllers.expression.evaluate(props.exp);
          }

          if (props.value) {
            state.controllers.flow.transition(props.value);
          }
        }
      }}
    >
      {props.label}
    </button>
  );
};

interface CollectionAsset extends Asset<"collection"> {
  /** values in a collection */
  values: Array<AssetWrapper<any>>;
}

/** basic collection asset */
const Collection = (props: CollectionAsset) => {
  return (
    <div id={props.id}>
      {props.values.map((a) => (
        <ReactAsset key={a.asset.id} {...a.asset} />
      ))}
    </div>
  );
};

export const simpleFlow: Flow<any> = {
  id: "flow_1",
  views: [
    {
      id: "first_view",
      type: "simple",
      value: "{{foo.bar}}",
    },
  ],
  navigation: {
    BEGIN: "flow_1",
    flow_1: {
      startState: "view_1",
      view_1: {
        state_type: "VIEW",
        ref: "first_view",
        transitions: {
          "*": "end_1",
        },
      },
      end_1: {
        state_type: "END",
        outcome: "end",
      },
    },
  },
};

/**
 * Registers a simple asset as a react comp
 */
export class SimpleAssetPlugin implements ReactPlayerPlugin {
  name = "simple-asset-plugin";

  applyReact(rp: ReactPlayer) {
    rp.assetRegistry.set({ type: "simple" }, SimpleAsset);
    rp.assetRegistry.set({ type: "action" }, Action);
    rp.assetRegistry.set({ type: "collection" }, Collection);
  }
}
