import { Flow } from '@player-ui/player';

export const transitionFlow: Flow = {
  id: 'test-flow',
  views: [
    {
      id: 'view-1',
      type: 'collection',
      values: [
        {
          asset: {
            id: 'text-1',
            type: 'text',
            value: 'Enter the name of your favorite pet:',
          },
        },
        {
          asset: {
            id: 'input-1',
            binding: 'pet.name',
            type: 'input',
          },
        },
        {
          asset: {
            id: 'action-1',
            value: 'Next',
            type: 'action',
            label: {
              asset: {
                id: 'action-1-label',
                type: 'text',
                value: 'Click to finish the flow with some custom data',
              },
            },
          },
        },
      ],
    },
  ],
  data: {},
  navigation: {
    BEGIN: 'FLOW_1',
    FLOW_1: {
      startState: 'VIEW_1',
      VIEW_1: {
        state_type: 'VIEW',
        ref: 'view-1',
        transitions: {
          Next: 'END',
        },
      },
      END: {
        state_type: 'END',
        outcome: 'favoritePet',
        param: '{{pet.name}}',
      },
    },
  },
} as any;
