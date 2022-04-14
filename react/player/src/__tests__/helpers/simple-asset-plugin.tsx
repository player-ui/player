import React from 'react';
import type { Asset as AssetType, AssetWrapper, Flow } from '@player-ui/player';
import { usePlayer } from '@player-ui/react-utils';
import { Asset } from '@player-ui/react-asset';
import type { WebPlayer, WebPlayerPlugin } from '../..';

interface SimpleAsset extends AssetType<'simple'> {
  /** text value of the asset */
  value?: string;
}

/** basic aset */
const SimpleAsset = (props: SimpleAsset) => (
  <div id={props.id}>{props.value}</div>
);

interface ActionAsset extends AssetType<'action'> {
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

        if (state?.status === 'in-progress') {
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

interface CollectionAsset extends AssetType<'collection'> {
  /** values in a collection */
  values: Array<AssetWrapper<any>>;
}

/** basic collection asset */
const Collection = (props: CollectionAsset) => {
  return (
    <div id={props.id}>
      {props.values.map((a) => (
        <Asset key={a.asset.id} {...a.asset} />
      ))}
    </div>
  );
};

export const simpleFlow: Flow<any> = {
  id: 'flow_1',
  views: [
    {
      id: 'first_view',
      type: 'simple',
      value: '{{foo.bar}}',
    },
  ],
  navigation: {
    BEGIN: 'flow_1',
    flow_1: {
      startState: 'view_1',
      view_1: {
        state_type: 'VIEW',
        ref: 'first_view',
        transitions: {
          '*': 'end_1',
        },
      },
      end_1: {
        state_type: 'END',
        outcome: 'end',
      },
    },
  },
};

/**
 * Registers a simple asset as a react comp
 */
export class SimpleAssetPlugin implements WebPlayerPlugin {
  name = 'simple-asset-plugin';

  applyWeb(wp: WebPlayer) {
    wp.assetRegistry.set({ type: 'simple' }, SimpleAsset);
    wp.assetRegistry.set({ type: 'action' }, Action);
    wp.assetRegistry.set({ type: 'collection' }, Collection);
  }
}
