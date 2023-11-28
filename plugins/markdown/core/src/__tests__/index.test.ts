import { describe, it, expect } from "vitest";
import type { InProgressState, Flow } from "@player-ui/player";
import { Player } from "@player-ui/player";
import { Registry } from "@player-ui/partial-match-registry";
import { PartialMatchFingerprintPlugin } from "@player-ui/partial-match-fingerprint-plugin";
import { mockMappers } from "./helpers";
import { MarkdownPlugin } from "..";

describe("MarkdownPlugin", () => {
  describe("Transform Operation", () => {
    const unparsedFlow: Flow = {
      id: "markdown-flow",
      data: {
        internal: {
          locale: {
            linkMarkdown:
              "Learn more at [TurboTax Canada](https://turbotax.intuit.ca)",
          },
        },
      },
      views: [
        {
          id: "markdown-view",
          type: "questionAnswer",
          title: {
            asset: {
              id: "markdown-view-title",
              type: "markdown",
              value: "{{internal.locale.linkMarkdown}}",
            },
          },
          primaryInfo: {
            asset: {
              id: "markdown-primaryInfo-collection",
              type: "collection",
              values: [
                {
                  asset: {
                    id: "markdown-primaryInfo-collection-bold",
                    type: "markdown",
                    value: "some **bold text**",
                  },
                },
                {
                  asset: {
                    id: "markdown-primaryInfo-collection-italic",
                    type: "markdown",
                    value: "*italicized text*",
                  },
                },
                {
                  asset: {
                    id: "markdown-primaryInfo-collection-orderd-list",
                    type: "markdown",
                    value: "1. First\n2. Second\n3. Third",
                  },
                },
                {
                  asset: {
                    id: "markdown-primaryInfo-collection-unorderd-list",
                    type: "markdown",
                    value:
                      "- [First](https://turbotax.intuit.ca)\n- Second\n- Third",
                  },
                },
                {
                  asset: {
                    id: "markdown-primaryInfo-collection-image",
                    type: "markdown",
                    value: "![alt text](image.png)",
                  },
                },
                {
                  asset: {
                    id: "markdown-primaryInfo-collection-unsupported",
                    type: "markdown",
                    value: "Highlights are ==not supported==",
                  },
                },
              ],
            },
          },
        },
      ],
      navigation: {
        BEGIN: "FLOW_1",
        FLOW_1: {
          startState: "VIEW_1",
          VIEW_1: {
            state_type: "VIEW",
            ref: "markdown-view",
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

    it("parses the flow containing markdown into valid FRF, based on the given mappers", () => {
      const player = new Player({
        plugins: [new MarkdownPlugin(mockMappers)],
      });
      player.start(unparsedFlow);

      const view = (player.getState() as InProgressState).controllers.view
        .currentView?.lastUpdate;

      expect(view).toMatchInlineSnapshot(`
        {
          "id": "markdown-view",
          "primaryInfo": {
            "asset": {
              "id": "markdown-primaryInfo-collection",
              "type": "collection",
              "values": [
                {
                  "asset": {
                    "id": "markdown-primaryInfo-collection-bold-composite-7",
                    "type": "composite",
                    "values": [
                      {
                        "asset": {
                          "id": "markdown-primaryInfo-collection-bold-text-4",
                          "type": "text",
                          "value": "some ",
                        },
                      },
                      {
                        "asset": {
                          "id": "markdown-primaryInfo-collection-bold-text-5",
                          "modifiers": [
                            {
                              "type": "tag",
                              "value": "important",
                            },
                          ],
                          "type": "text",
                          "value": "bold text",
                        },
                      },
                    ],
                  },
                },
                {
                  "asset": {
                    "id": "markdown-primaryInfo-collection-italic-text-8",
                    "modifiers": [
                      {
                        "type": "tag",
                        "value": "emphasis",
                      },
                    ],
                    "type": "text",
                    "value": "italicized text",
                  },
                },
                {
                  "asset": {
                    "id": "markdown-primaryInfo-collection-orderd-list-list-20",
                    "metaData": {
                      "listType": "ordered",
                    },
                    "type": "list",
                    "values": [
                      {
                        "asset": {
                          "id": "markdown-primaryInfo-collection-orderd-list-text-11",
                          "type": "text",
                          "value": "First",
                        },
                      },
                      {
                        "asset": {
                          "id": "markdown-primaryInfo-collection-orderd-list-text-14",
                          "type": "text",
                          "value": "Second",
                        },
                      },
                      {
                        "asset": {
                          "id": "markdown-primaryInfo-collection-orderd-list-text-17",
                          "type": "text",
                          "value": "Third",
                        },
                      },
                    ],
                  },
                },
                {
                  "asset": {
                    "id": "markdown-primaryInfo-collection-unorderd-list-list-31",
                    "type": "list",
                    "values": [
                      {
                        "asset": {
                          "id": "markdown-primaryInfo-collection-unorderd-list-text-21",
                          "modifiers": [
                            {
                              "metaData": {
                                "ref": "https://turbotax.intuit.ca",
                              },
                              "type": "link",
                            },
                          ],
                          "type": "text",
                          "value": "First",
                        },
                      },
                      {
                        "asset": {
                          "id": "markdown-primaryInfo-collection-unorderd-list-text-25",
                          "type": "text",
                          "value": "Second",
                        },
                      },
                      {
                        "asset": {
                          "id": "markdown-primaryInfo-collection-unorderd-list-text-28",
                          "type": "text",
                          "value": "Third",
                        },
                      },
                    ],
                  },
                },
                {
                  "asset": {
                    "accessibility": "alt text",
                    "id": "markdown-primaryInfo-collection-image-image-32",
                    "metaData": {
                      "ref": "image.png",
                    },
                    "type": "image",
                  },
                },
                {
                  "asset": {
                    "id": "markdown-primaryInfo-collection-unsupported-text-34",
                    "type": "text",
                    "value": "Highlights are ==not supported==",
                  },
                },
              ],
            },
          },
          "title": {
            "asset": {
              "id": "markdown-view-title-composite-3",
              "type": "composite",
              "values": [
                {
                  "asset": {
                    "id": "markdown-view-title-text-0",
                    "type": "text",
                    "value": "Learn more at ",
                  },
                },
                {
                  "asset": {
                    "id": "markdown-view-title-text-1",
                    "modifiers": [
                      {
                        "metaData": {
                          "ref": "https://turbotax.intuit.ca",
                        },
                        "type": "link",
                      },
                    ],
                    "type": "text",
                    "value": "TurboTax Canada",
                  },
                },
              ],
            },
          },
          "type": "questionAnswer",
        }
      `);
    });

    it("parses the flow, with only the required mappers", () => {
      const player = new Player({
        plugins: [
          new MarkdownPlugin({
            text: mockMappers.text,
            paragraph: mockMappers.paragraph,
            collection: mockMappers.collection,
          }),
        ],
      });
      player.start(unparsedFlow);

      const view = (player.getState() as InProgressState).controllers.view
        .currentView?.lastUpdate;

      expect(view).toMatchInlineSnapshot(`
        {
          "id": "markdown-view",
          "primaryInfo": {
            "asset": {
              "id": "markdown-primaryInfo-collection",
              "type": "collection",
              "values": [
                {
                  "asset": {
                    "id": "markdown-primaryInfo-collection-bold",
                    "type": "text",
                    "value": "some **bold text**",
                  },
                },
                {
                  "asset": {
                    "id": "markdown-primaryInfo-collection-italic",
                    "type": "text",
                    "value": "*italicized text*",
                  },
                },
                {
                  "asset": {
                    "id": "markdown-primaryInfo-collection-orderd-list",
                    "type": "text",
                    "value": "1. First
        2. Second
        3. Third",
                  },
                },
                {
                  "asset": {
                    "id": "markdown-primaryInfo-collection-unorderd-list",
                    "type": "text",
                    "value": "- [First](https://turbotax.intuit.ca)
        - Second
        - Third",
                  },
                },
                {
                  "asset": {
                    "id": "markdown-primaryInfo-collection-image",
                    "type": "text",
                    "value": "![alt text](image.png)",
                  },
                },
                {
                  "asset": {
                    "id": "markdown-primaryInfo-collection-unsupported-text-36",
                    "type": "text",
                    "value": "Highlights are ==not supported==",
                  },
                },
              ],
            },
          },
          "title": {
            "asset": {
              "id": "markdown-view-title",
              "type": "text",
              "value": "Learn more at [TurboTax Canada](https://turbotax.intuit.ca)",
            },
          },
          "type": "questionAnswer",
        }
      `);
    });
  });

  describe("Interactions with Asset Registry", () => {
    it("parses regular flow and maps assets", () => {
      const fingerprint = new PartialMatchFingerprintPlugin(new Registry());

      fingerprint.register({ type: "action" }, 0);
      fingerprint.register({ type: "text" }, 1);
      fingerprint.register({ type: "composite" }, 2);

      const player = new Player({
        plugins: [fingerprint, new MarkdownPlugin(mockMappers)],
      });

      player.start({
        id: "action-with-expression",
        views: [
          {
            id: "action",
            type: "action",
            exp: "{{count}} = {{count}} + 1",
            label: {
              asset: {
                id: "action-label",
                type: "markdown",
                value: "Clicked {{count}} *times*",
              },
            },
          },
        ],
        data: {
          count: 0,
        },
        navigation: {
          BEGIN: "FLOW_1",
          FLOW_1: {
            startState: "VIEW_1",
            VIEW_1: {
              state_type: "VIEW",
              ref: "action",
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
      });

      // the parser should create 2 text assets: `Clicked {{count}}` and a italicized `times`:
      const view = (player.getState() as InProgressState).controllers.view
        .currentView?.lastUpdate;

      expect(view).toMatchInlineSnapshot(`
        {
          "exp": "{{count}} = {{count}} + 1",
          "id": "action",
          "label": {
            "asset": {
              "id": "action-label-composite-41",
              "type": "composite",
              "values": [
                {
                  "asset": {
                    "id": "action-label-text-38",
                    "type": "text",
                    "value": "Clicked 0 ",
                  },
                },
                {
                  "asset": {
                    "id": "action-label-text-39",
                    "modifiers": [
                      {
                        "type": "tag",
                        "value": "emphasis",
                      },
                    ],
                    "type": "text",
                    "value": "times",
                  },
                },
              ],
            },
          },
          "type": "action",
        }
      `);
      expect(fingerprint.get("action-label-text-38")).toBe(1);
      expect(fingerprint.get("action-label-text-39")).toBe(1);
    });
  });
});
