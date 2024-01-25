import React from 'react';
import { Action, Collection } from '@player-ui/reference-assets-components';
import type { DSLFlow } from '@player-tools/dsl';
import { expression as e } from '@player-tools/dsl';

const view1 = (
  <Collection>
    <Collection.Values>
      <Action value="Next">
        <Action.Label>End the flow (success)</Action.Label>
      </Action>
      <Action exp={e`{{foo.bar..}}`}>
        <Action.Label>End the flow (error)</Action.Label>
      </Action>
    </Collection.Values>
  </Collection>
);

const flow: DSLFlow = {
  id: 'test-flow',
  views: [view1],
  navigation: {
    BEGIN: 'FLOW_1',
    FLOW_1: {
      startState: 'VIEW_1',
      VIEW_1: {
        state_type: 'VIEW',
        ref: view1,
        transitions: {
          '*': 'END_Done',
        },
      },
      END_Done: {
        state_type: 'END',
        outcome: 'DONE',
      },
    },
  },
};

export default flow;
