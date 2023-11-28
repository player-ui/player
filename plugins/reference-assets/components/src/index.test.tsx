import React from "react";
import { render, binding as b } from "@player-tools/dsl";
import { Text, Action, Info, Collection, Input } from ".";

describe("JSON serialization", () => {
  describe("text", () => {
    it("works for basic text", async () => {
      expect((await render(<Text>Hello World</Text>)).jsonValue).toStrictEqual({
        id: "root",
        type: "text",
        value: "Hello World",
      });
    });

    it("works for value prop", async () => {
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
    it("adds a label", async () => {
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

    it("adds values", async () => {
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
    it("works for a large view", async () => {
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
      });
    });
  });
});
