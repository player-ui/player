import React from 'react';
import { Action } from '@player-ui/reference-assets-components';
import type { DSLFlow } from '@player-tools/dsl';
import {
  binding as b,
  expression as e,
  makeBindingsForObject,
} from '@player-tools/dsl';

const schema = {
  count: {
    type: 'NumberType',
  },
};

const data = makeBindingsForObject(schema);

const view1 = (
  <Action exp={e`${data.count} = ${data.count} + 1`}>
    <Action.Label>Count: {b`count`}</Action.Label>
  </Action>
);

const flow: DSLFlow = {
  id: 'test-flow',
  views: [view1],
  data: {
    count: 0,
  },
  schema,
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
