export default {
  id: 'generated-flow',
  views: [
    {
      id: 'action',
      type: 'collection',
      values: [
        {
          asset: {
            id: 'just-a-label',
            type: 'text',
            value: 'Click some stuff!',
          },
        },
        {
          asset: {
            id: 'action-1',
            type: 'action',
            exp: '{{count1}} += 1',
            label: {
              asset: {
                id: 'action-label-1',
                type: 'text',
                value: 'Clicked {{count1}} times',
              },
            },
          },
        },
        {
          asset: {
            id: 'action-2',
            type: 'action',
            exp: '{{count2}} += 1',
            label: {
              asset: {
                id: 'action-label-2',
                type: 'text',
                value: 'Clicked {{count2}} times',
              },
            },
          },
        },
      ],
    },
  ],
  data: {
    count1: 0,
    count2: 0,
  },
  navigation: {
    BEGIN: 'FLOW_1',
    FLOW_1: {
      startState: 'VIEW_1',
      VIEW_1: {
        state_type: 'VIEW',
        ref: 'action',
        transitions: {
          '*': 'END_Done',
        },
      },
      END_Done: {
        state_type: 'END',
        outcome: 'done',
      },
    },
  },
};
