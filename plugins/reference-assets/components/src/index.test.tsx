import React from 'react';
import { render, binding as b } from '@player-tools/dsl';
import { Text, Action, Info, Collection, Input, Choice, ChoicesEntry } from '.';

describe('JSON serialization', () => {
  describe('text', () => {
    it('works for basic text', async () => {
      expect((await render(<Text>Hello World</Text>)).jsonValue).toStrictEqual({
        id: 'root',
        type: 'text',
        value: 'Hello World',
      });
    });

    it('works for value prop', async () => {
      expect(
        (await render(<Text value="Hello World" />)).jsonValue
      ).toStrictEqual({
        id: 'root',
        type: 'text',
        value: 'Hello World',
      });
    });
  });

  describe('collection', () => {
    it('adds a label', async () => {
      expect(
        (
          await render(
            <Collection id="test-id">
              <Collection.Label>Test</Collection.Label>
            </Collection>
          )
        ).jsonValue
      ).toStrictEqual({
        id: 'test-id',
        type: 'collection',
        label: {
          asset: {
            id: 'test-id-label',
            type: 'text',
            value: 'Test',
          },
        },
      });
    });

    it('adds values', async () => {
      expect(
        (
          await render(
            <Collection>
              <Collection.Values>
                <Text>First</Text>
                <Text>Second</Text>
              </Collection.Values>
            </Collection>
          )
        ).jsonValue
      ).toStrictEqual({
        id: 'root',
        type: 'collection',
        values: [
          {
            asset: {
              id: 'values-0',
              type: 'text',
              value: 'First',
            },
          },
          {
            asset: {
              id: 'values-1',
              type: 'text',
              value: 'Second',
            },
          },
        ],
      });
    });
  });

  describe('info', () => {
    it('works for a large view', async () => {
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
            </Info>
          )
        ).jsonValue
      ).toStrictEqual({
        id: 'info-view',
        type: 'info',
        title: {
          asset: {
            id: 'info-view-title',
            type: 'text',
            value: 'Info Title',
          },
        },
        primaryInfo: {
          asset: {
            id: 'info-view-primaryInfo',
            type: 'collection',
            values: [
              {
                asset: {
                  id: 'info-view-primaryInfo-values-0',
                  type: 'input',
                  binding: 'foo.bar',
                  label: {
                    asset: {
                      id: 'info-view-primaryInfo-values-0-label',
                      type: 'text',
                      value: 'Input Label',
                    },
                  },
                },
              },
              {
                asset: {
                  id: 'input-result',
                  type: 'text',
                  value: '{{foo.bar}}',
                },
              },
            ],
          },
        },
        actions: [
          {
            asset: {
              id: 'info-view-actions-0',
              type: 'action',
              value: 'next',
              label: {
                asset: {
                  id: 'info-view-actions-0-label',
                  type: 'text',
                  value: 'Continue',
                },
              },
            },
          },
        ],
      });
    });
  });

  describe('choice', () => {
    it('works for title and choices', async () => {
      expect(
        (await render
          (
            <Choice id="choice-root" binding={b`foo.bar`}>
              <Choice.Title>title</Choice.Title>
              <Choice.Choices>
                <ChoicesEntry id="choice-option-1">
                  <ChoicesEntry.Label id="choice-option-1-label" value="choice 1">
                    choice 1
                  </ChoicesEntry.Label>
                </ChoicesEntry>
                <ChoicesEntry id="choice-option-2">
                  <ChoicesEntry.Label id="choice-option-2-label" value="choice 2">
                    choice 2
                  </ChoicesEntry.Label>
                </ChoicesEntry>
              </Choice.Choices>
            </Choice>
          )
        ).jsonValue
      ).toStrictEqual({
        id: 'choice-root',
        type: 'choice',
        title: {
          asset: {
            id: 'choice-view-title',
            type: 'text',
            value: 'title',
          },
        },
        choices: [
          {
            "id": "choice-option-1",
            "label": {
              "asset": {
                "id": "choice-option-1-label",
                "type": "text",
                "value": "choice 1"
              }
            },
            "value": "choice 1"
          },
          {
            "id": "choice-option-2",
            "label": {
              "asset": {
                "id": "choice-option-2-label",
                "type": "text",
                "value": "choice 2"
              }
            },
            "value": "choice 2"
          }
        ]
      });
    });

    it('works with a note', async () => {
      expect(
        (await render
          (
            <Choice id="choice-root" binding={b`foo.bar`}>
              <Choice.Title>title</Choice.Title>
              <Choice.Note>note</Choice.Note>
              <Choice.Choices>
                <ChoicesEntry id="choice-option-1">
                  <ChoicesEntry.Label id="choice-option-1-label" value="choice 1">
                    choice 1
                  </ChoicesEntry.Label>
                </ChoicesEntry>
                <ChoicesEntry id="choice-option-2">
                  <ChoicesEntry.Label id="choice-option-2-label" value="choice 2">
                    choice 2
                  </ChoicesEntry.Label>
                </ChoicesEntry>
              </Choice.Choices>
            </Choice>
          )
        ).jsonValue
      ).toStrictEqual({
        id: 'choice-root',
        type: 'choice',
        title: {
          asset: {
            id: 'choice-view-title',
            type: 'text',
            value: 'title',
          },
        },
        note: {
          asset: {
            id: 'choice-view-note',
            type: 'text',
            value: 'note',
          },
        },
        choices: [
          {
            "id": "choice-option-1",
            "label": {
              "asset": {
                "id": "choice-option-1-label",
                "type": "text",
                "value": "choice 1"
              }
            },
            "value": "choice 1"
          },
          {
            "id": "choice-option-2",
            "label": {
              "asset": {
                "id": "choice-option-2-label",
                "type": "text",
                "value": "choice 2"
              }
            },
            "value": "choice 2"
          }
        ]
      });
    });
  });
});
