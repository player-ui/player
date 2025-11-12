import { describe, it, expect } from "vitest";
import type { InProgressState, Flow } from "@player-ui/player";
import { Player } from "@player-ui/player";
import { Registry } from "@player-ui/partial-match-registry";
import { PartialMatchFingerprintPlugin } from "@player-ui/partial-match-fingerprint-plugin";
import { buildMockMappers } from "./helpers";
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
        plugins: [new MarkdownPlugin(buildMockMappers())],
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
                    "id": "markdown-primaryInfo-collection-bold-composite-3",
                    "type": "composite",
                    "values": [
                      {
                        "asset": {
                          "id": "markdown-primaryInfo-collection-bold-text-0",
                          "type": "text",
                          "value": "some ",
                        },
                      },
                      {
                        "asset": {
                          "id": "markdown-primaryInfo-collection-bold-text-1",
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
                    "id": "markdown-primaryInfo-collection-italic-text-4",
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
                    "id": "markdown-primaryInfo-collection-orderd-list-list-16",
                    "metaData": {
                      "listType": "ordered",
                    },
                    "type": "list",
                    "values": [
                      {
                        "asset": {
                          "id": "markdown-primaryInfo-collection-orderd-list-text-7",
                          "type": "text",
                          "value": "First",
                        },
                      },
                      {
                        "asset": {
                          "id": "markdown-primaryInfo-collection-orderd-list-text-10",
                          "type": "text",
                          "value": "Second",
                        },
                      },
                      {
                        "asset": {
                          "id": "markdown-primaryInfo-collection-orderd-list-text-13",
                          "type": "text",
                          "value": "Third",
                        },
                      },
                    ],
                  },
                },
                {
                  "asset": {
                    "id": "markdown-primaryInfo-collection-unorderd-list-list-27",
                    "type": "list",
                    "values": [
                      {
                        "asset": {
                          "id": "markdown-primaryInfo-collection-unorderd-list-text-17",
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
                          "id": "markdown-primaryInfo-collection-unorderd-list-text-21",
                          "type": "text",
                          "value": "Second",
                        },
                      },
                      {
                        "asset": {
                          "id": "markdown-primaryInfo-collection-unorderd-list-text-24",
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
                    "id": "markdown-primaryInfo-collection-image-image-28",
                    "metaData": {
                      "ref": "image.png",
                    },
                    "type": "image",
                  },
                },
                {
                  "asset": {
                    "id": "markdown-primaryInfo-collection-unsupported-text-30",
                    "type": "text",
                    "value": "Highlights are ==not supported==",
                  },
                },
              ],
            },
          },
          "title": {
            "asset": {
              "id": "markdown-view-title-composite-35",
              "type": "composite",
              "values": [
                {
                  "asset": {
                    "id": "markdown-view-title-text-32",
                    "type": "text",
                    "value": "Learn more at ",
                  },
                },
                {
                  "asset": {
                    "id": "markdown-view-title-text-33",
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
            text: buildMockMappers().text,
            paragraph: buildMockMappers().paragraph,
            collection: buildMockMappers().collection,
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
                    "id": "markdown-primaryInfo-collection-unsupported-text-0",
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

  it("handles undefined markdown values by outputting an empty text asset", () => {
    const player = new Player({
      plugins: [new MarkdownPlugin(buildMockMappers())],
    });

    const flowWithUndefined: Flow = {
      id: "markdown-undefined-flow",
      views: [
        {
          id: "action",
          type: "action",
          label: {
            asset: {
              id: "md-undefined",
              type: "markdown",
              // intentionally no `value` provided
            } as any,
          },
        },
      ],
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
    };

    player.start(flowWithUndefined);

    const view = (player.getState() as InProgressState).controllers.view
      .currentView?.lastUpdate as any;

    // Expect plugin not to throw and to produce a text asset with empty value
    expect(view?.label?.asset?.type).toBe("text");
    expect(view?.label?.asset?.value).toBe("");
  });

  it("handles empty string markdown values by outputting an empty text asset", () => {
    const player = new Player({
      plugins: [new MarkdownPlugin(buildMockMappers())],
    });

    const flowWithEmpty: Flow = {
      id: "markdown-empty-flow",
      views: [
        {
          id: "action",
          type: "action",
          label: {
            asset: {
              id: "md-empty",
              type: "markdown",
              value: "",
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
    };

    player.start(flowWithEmpty);

    const view = (player.getState() as InProgressState).controllers.view
      .currentView?.lastUpdate as any;

    expect(view?.label?.asset?.type).toBe("text");
    expect(view?.label?.asset?.value).toBe("");
  });

  describe("Interactions with Asset Registry", () => {
    it("parses regular flow and maps assets", () => {
      const fingerprint = new PartialMatchFingerprintPlugin(new Registry());

      fingerprint.register({ type: "action" }, 0);
      fingerprint.register({ type: "text" }, 1);
      fingerprint.register({ type: "composite" }, 2);

      const player = new Player({
        plugins: [fingerprint, new MarkdownPlugin(buildMockMappers())],
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
              "id": "action-label-composite-3",
              "type": "composite",
              "values": [
                {
                  "asset": {
                    "id": "action-label-text-0",
                    "type": "text",
                    "value": "Clicked 0 ",
                  },
                },
                {
                  "asset": {
                    "id": "action-label-text-1",
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
      expect(fingerprint.get("action-label-text-0")).toBe(1);
      expect(fingerprint.get("action-label-text-1")).toBe(1);
    });
  });
});
