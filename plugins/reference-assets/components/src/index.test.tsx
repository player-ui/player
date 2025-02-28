import React from "react";
import { describe, test, expect } from "vitest";
import { render, binding as b } from "@player-tools/dsl";
import { Text, Action, Info, Collection, Input, Choice, ChatMessage } from ".";

describe("JSON serialization", () => {
  describe("text", () => {
    test("works for basic text", async () => {
      expect((await render(<Text>Hello World</Text>)).jsonValue).toStrictEqual({
        id: "root",
        type: "text",
        value: "Hello World",
      });
    });

    test("works for value prop", async () => {
      expect(
        (await render(<Text value="Hello World" />)).jsonValue,
      ).toStrictEqual({
        id: "root",
        type: "text",
        value: "Hello World",
      });
    });
  });

  describe("collection", () => {
    test("adds a label", async () => {
      expect(
        (
          await render(
            <Collection id="test-id">
              <Collection.Label>Test</Collection.Label>
            </Collection>,
          )
        ).jsonValue,
      ).toStrictEqual({
        id: "test-id",
        type: "collection",
        label: {
          asset: {
            id: "test-id-label",
            type: "text",
            value: "Test",
          },
        },
      });
    });

    test("adds values", async () => {
      expect(
        (
          await render(
            <Collection>
              <Collection.Values>
                <Text>First</Text>
                <Text>Second</Text>
              </Collection.Values>
            </Collection>,
          )
        ).jsonValue,
      ).toStrictEqual({
        id: "root",
        type: "collection",
        values: [
          {
            asset: {
              id: "values-0",
              type: "text",
              value: "First",
            },
          },
          {
            asset: {
              id: "values-1",
              type: "text",
              value: "Second",
            },
          },
        ],
      });
    });
  });

  describe("info", () => {
    test("works for a large view", async () => {
      expect(
        (
          await render(
            <Info id="info-view">
              <Info.Title>Info Title</Info.Title>
              <Info.PrimaryInfo>
                <Input binding={b`foo.bar`}>
                  <Input.Label>Input Label</Input.Label>
                </Input>
                <Text id="input-result" value={b`foo.bar`.toString()} />
              </Info.PrimaryInfo>
              <Info.Actions>
                <Action value="next">
                  <Action.Label>Continue</Action.Label>
                </Action>
              </Info.Actions>
              <Info.Footer>Footer Text</Info.Footer>
            </Info>,
          )
        ).jsonValue,
      ).toStrictEqual({
        id: "info-view",
        type: "info",
        title: {
          asset: {
            id: "info-view-title",
            type: "text",
            value: "Info Title",
          },
        },
        primaryInfo: {
          asset: {
            id: "info-view-primaryInfo",
            type: "collection",
            values: [
              {
                asset: {
                  id: "info-view-primaryInfo-values-0",
                  type: "input",
                  binding: "foo.bar",
                  label: {
                    asset: {
                      id: "info-view-primaryInfo-values-0-label",
                      type: "text",
                      value: "Input Label",
                    },
                  },
                },
              },
              {
                asset: {
                  id: "input-result",
                  type: "text",
                  value: "{{foo.bar}}",
                },
              },
            ],
          },
        },
        actions: [
          {
            asset: {
              id: "info-view-actions-0",
              type: "action",
              value: "next",
              label: {
                asset: {
                  id: "info-view-actions-0-label",
                  type: "text",
                  value: "Continue",
                },
              },
            },
          },
        ],
        footer: {
          asset: {
            id: "info-view-footer",
            type: "text",
            value: "Footer Text",
          },
        },
      });
    });
  });

  describe("choice", () => {
    test("works for title and choices", async () => {
      expect(
        (
          await render(
            <Choice id="choice-without-note" binding={b`foo.bar`}>
              <Choice.Title>This is a list of choices</Choice.Title>
              <Choice.Items>
                <Choice.Item id="item-1" value="Item 1">
                  <Choice.Item.Label>Item 1</Choice.Item.Label>
                </Choice.Item>
                <Choice.Item id="item-2" value="Item 2">
                  <Choice.Item.Label>Item 2</Choice.Item.Label>
                </Choice.Item>
              </Choice.Items>
            </Choice>,
          )
        ).jsonValue,
      ).toStrictEqual({
        id: "choice-without-note",
        type: "choice",
        binding: "foo.bar",
        title: {
          asset: {
            id: "choice-without-note-title",
            type: "text",
            value: "This is a list of choices",
          },
        },
        items: [
          {
            id: "item-1",
            value: "Item 1",
            label: {
              asset: {
                id: "choice-without-note-items-0-label",
                type: "text",
                value: "Item 1",
              },
            },
          },
          {
            id: "item-2",
            value: "Item 2",
            label: {
              asset: {
                id: "choice-without-note-items-1-label",
                type: "text",
                value: "Item 2",
              },
            },
          },
        ],
      });
    });

    test("works with a note", async () => {
      expect(
        (
          await render(
            <Choice id="choice-with-note" binding={b`foo.bar`}>
              <Choice.Title>This is a list of choices</Choice.Title>
              <Choice.Note>This is a note</Choice.Note>
              <Choice.Items>
                <Choice.Item id="item-1" value="Item 1">
                  <Choice.Item.Label>Item 1</Choice.Item.Label>
                </Choice.Item>
                <Choice.Item id="item-2" value="Item 2">
                  <Choice.Item.Label>Item 2</Choice.Item.Label>
                </Choice.Item>
              </Choice.Items>
            </Choice>,
          )
        ).jsonValue,
      ).toStrictEqual({
        id: "choice-with-note",
        type: "choice",
        binding: "foo.bar",
        title: {
          asset: {
            id: "choice-with-note-title",
            type: "text",
            value: "This is a list of choices",
          },
        },
        note: {
          asset: {
            id: "choice-with-note-note",
            type: "text",
            value: "This is a note",
          },
        },
        items: [
          {
            id: "item-1",
            value: "Item 1",
            label: {
              asset: {
                id: "choice-with-note-items-0-label",
                type: "text",
                value: "Item 1",
              },
            },
          },
          {
            id: "item-2",
            value: "Item 2",
            label: {
              asset: {
                id: "choice-with-note-items-1-label",
                type: "text",
                value: "Item 2",
              },
            },
          },
        ],
      });
    });
  });

  describe("chat message", () => {
    test("works for chat-message value", async () => {
      expect(
        (
          await render(
            <ChatMessage id="1">
              <ChatMessage.Value>
                <Text>Hello World!</Text>
              </ChatMessage.Value>
            </ChatMessage>,
          )
        ).jsonValue,
      ).toStrictEqual({
        id: "1",
        type: "chat-message",
        value: {
          asset: {
            id: "value",
            type: "text",
            value: "Hello World!",
          },
        },
      });
    });

    test("works with value is null", async () => {
      expect(
        (await render(<ChatMessage id="1"></ChatMessage>)).jsonValue,
      ).toStrictEqual({
        id: "1",
        type: "chat-message",
      });
    });
  });
});
