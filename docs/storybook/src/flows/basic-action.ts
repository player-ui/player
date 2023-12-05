import { Flow } from "@player-ui/react";

const actionFlow: Flow<any> = {
  id: "flow_1",
  views: [
    {
      id: "first_view",
      type: "info",
      title: {
        asset: {
          id: "view-title",
          type: "text",
          value: "This is a simple player view",
        },
      },
      subTitle: {
        asset: {
          id: "view-title",
          type: "text",
          value: 'Click the "action" below to increment the count.',
        },
      },
      primaryInfo: {
        asset: {
          id: "buttons",
          type: "collection",
          values: [
            {
              asset: {
                id: "add-action",
                type: "action",
                exp: "{{count}} = {{count}} + 1",
                label: {
                  asset: {
                    id: "foo",
                    type: "text",
                    value: "Clicked {{count}} times",
                  },
                },
              },
            },
            {
              asset: {
                id: "next-view",
                type: "action",
                value: "end",
                label: {
                  asset: {
                    id: "next-view-label",
                    type: "text",
                    value: "End Flow",
                  },
                },
              },
            },
          ],
        },
      },
    },
  ],
  data: {
    count: 0,
  },
  navigation: {
    BEGIN: "flow_1",
    flow_1: {
      startState: "view_1",
      view_1: {
        state_type: "VIEW",
        ref: "first_view",
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

export default actionFlow;
