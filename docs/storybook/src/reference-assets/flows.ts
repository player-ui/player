import { Flow } from '@player-ui/react';
import { makeFlow } from '@player-ui/make-flow';

export const actionCountFlow = makeFlow({
  asset: {
    id: 'add-action',
    type: 'action',
    exp: '{{count}} = {{count}} + 1',
    label: {
      asset: {
        id: 'foo',
        type: 'text',
        value: 'Clicked {{count}} times',
      },
    },
  },
});

actionCountFlow.data = {
  count: 0,
};

export const actionNavigationFlow: Flow = {
  id: 'action-navigation-flow',
  views: [
    {
      id: 'view-1',
      type: 'collection',
      label: {
        asset: {
          id: 'title',
          type: 'text',
          value: 'View 1',
        },
      },
      values: [
        {
          asset: {
            id: 'action-prev',
            type: 'action',
            value: 'Prev',
            label: {
              asset: {
                id: 'action-prev-id',
                type: 'text',
                value: 'Go Back',
              },
            },
          },
        },
        {
          asset: {
            id: 'action-next',
            type: 'action',
            value: 'Next',
            label: {
              asset: {
                id: 'action-next-id',
                type: 'text',
                value: 'Next',
              },
            },
          },
        },
      ],
    },
    {
      id: 'view-2',
      type: 'collection',
      label: {
        asset: {
          id: 'title',
          type: 'text',
          value: 'View 2',
        },
      },
      values: [
        {
          asset: {
            id: 'action-prev',
            type: 'action',
            value: 'Prev',
            label: {
              asset: {
                id: 'action-prev-id',
                type: 'text',
                value: 'Go Back',
              },
            },
          },
        },
        {
          asset: {
            id: 'action-next',
            type: 'action',
            value: 'Next',
            label: {
              asset: {
                id: 'action-next-id',
                type: 'text',
                value: 'End',
              },
            },
          },
        },
      ],
    },
  ],
  navigation: {
    BEGIN: 'FLOW_1',
    FLOW_1: {
      startState: 'VIEW_1',
      VIEW_1: {
        state_type: 'VIEW',
        ref: 'view-1',
        transitions: {
          Next: 'VIEW_2',
          Prev: 'END',
        },
      },
      VIEW_2: {
        state_type: 'VIEW',
        ref: 'view-2',
        transitions: {
          Next: 'END',
          Prev: 'VIEW_1',
        },
      },
      END: {
        state_type: 'END',
        outcome: 'done',
      },
    },
  },
};

export const textFlow = makeFlow({
  id: 'view-1',
  type: 'collection',
  values: [
    {
      asset: {
        id: 'text-1',
        type: 'text',
        value: 'This is some text.',
      },
    },
    {
      asset: {
        id: 'text-2',
        type: 'text',
        value: 'This is some text that is a link',
        modifiers: [
          {
            type: 'link',
            metaData: {
              ref: 'https://intuit.com',
            },
          },
        ],
      },
    },
  ],
});

export const collectionFlow = makeFlow({
  id: 'view-1',
  type: 'collection',
  label: {
    asset: {
      id: 'title',
      type: 'text',
      value: 'Collections are used to group assets.',
    },
  },
  values: [
    {
      asset: {
        id: 'text-1',
        type: 'text',
        value: 'This is the first item in the collection',
      },
    },
    {
      asset: {
        id: 'text-2',
        type: 'text',
        value: 'This is the second item in the collection',
      },
    },
  ],
});

export const inputValidationFlow = makeFlow({
  id: 'input-1',
  type: 'input',
  label: {
    asset: {
      id: 'input-1-label',
      type: 'text',
      value: 'Input with validation and formatting',
    },
  },
  note: {
    asset: {
      id: 'input-1-note',
      type: 'text',
      value: 'It expects a positive integer',
    },
  },
  binding: 'foo.bar',
});

inputValidationFlow.schema = {
  ROOT: {
    foo: {
      type: 'FooType',
    },
  },
  FooType: {
    bar: {
      type: 'IntegerPosType',
      validation: [
        {
          type: 'required',
        },
      ],
    },
  },
};

export const inputTransitionFlow = makeFlow({
  id: 'input-validation',
  type: 'info',
  title: {
    asset: {
      id: 'title',
      type: 'text',
      value: 'Some validations can prevent users from advancing',
    },
  },
  primaryInfo: {
    asset: {
      id: 'primaryInfo',
      type: 'collection',
      values: [
        {
          asset: {
            id: 'input-1',
            type: 'input',
            label: {
              asset: {
                id: 'input-1-label',
                type: 'text',
                value: 'Input with validation and formatting',
              },
            },
            note: {
              asset: {
                id: 'input-1-note',
                type: 'text',
                value: 'It expects a positive integer',
              },
            },
            binding: 'foo.bar',
          },
        },
      ],
    },
  },
  actions: [
    {
      asset: {
        id: 'next-action',
        value: 'Next',
        type: 'action',
        label: {
          id: 'next-action-label',
          type: 'text',
          value: 'Continue',
        },
      },
    },
  ],
});

inputTransitionFlow.schema = inputValidationFlow.schema;

export const infoFlow = makeFlow({
  id: 'info-view',
  type: 'info',
  title: {
    asset: {
      id: 'info-title',
      type: 'text',
      value: 'View Title',
    },
  },
  actions: [
    {
      asset: {
        id: 'next-action',
        value: 'Next',
        type: 'action',
        label: {
          id: 'next-action-label',
          type: 'text',
          value: 'Continue',
        },
      },
    },
  ],
});
