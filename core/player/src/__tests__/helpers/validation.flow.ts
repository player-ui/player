export default {
  id: 'minimal-player-content-response-format',
  topic: 'MOCK',
  schema: {
    ROOT: {
      returns: {
        type: 'returnsType',
      },
    },
    returnsType: {
      input: {
        type: 'TextType',
        validation: [
          {
            type: 'required',
          },
          {
            param: 6,
            type: 'maxLength',
          },
        ],
      },
    },
  },
  data: {},
  views: [
    {
      id: 'KitchenSink-View1',
      title: {
        asset: {
          id: 'KitchenSink-View1-Title',
          type: 'text',
          value: 'Minimal JSON Example',
        },
      },
      type: 'questionAnswer',
    },
  ],
  navigation: {
    BEGIN: 'KitchenSinkFlow',
    KitchenSinkFlow: {
      END_Done: {
        outcome: 'doneWithTopic',
        state_type: 'END',
      },
      VIEW_KitchenSink_1: {
        ref: 'KitchenSink-View1',
        state_type: 'VIEW',
        transitions: {
          '*': 'END_Done',
        },
      },
      startState: 'VIEW_KitchenSink_1',
    },
  },
};
