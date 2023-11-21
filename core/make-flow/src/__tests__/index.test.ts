import { test, expect } from 'vitest';
import { makeFlow } from '..';

test('makes a flow from an asset', () => {
  expect(
    makeFlow({
      id: 'some-id',
      type: 'text',
      value: 'I am a text asset',
    })
  ).toStrictEqual({
    id: 'generated-flow',
    views: [
      {
        id: 'some-id',
        type: 'text',
        value: 'I am a text asset',
      },
    ],
    data: {},
    navigation: {
      BEGIN: 'FLOW_1',
      FLOW_1: {
        startState: 'VIEW_1',
        VIEW_1: {
          state_type: 'VIEW',
          ref: 'some-id',
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
  });
});

test('makes a flow using an array of assets', () => {
  expect(
    makeFlow([
      {
        id: 'some-id',
        type: 'text',
        value: 'I am a text asset',
      },
      {
        asset: {
          id: 'some-id-2',
          type: 'text',
          value: 'I am a text asset',
        },
      },
    ])
  ).toStrictEqual({
    id: 'generated-flow',
    views: [
      {
        id: 'collection',
        type: 'collection',
        values: [
          {
            asset: {
              id: 'some-id',
              type: 'text',
              value: 'I am a text asset',
            },
          },
          {
            asset: {
              id: 'some-id-2',
              type: 'text',
              value: 'I am a text asset',
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
          ref: 'collection',
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
  });
});
