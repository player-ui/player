import React from 'react';
import { expression as e } from '../../string-templates';
import { DSLCompiler } from '../compiler';
import type { Navigation } from '../../types';

test('treats jsx as view', async () => {
  const compiler = new DSLCompiler();

  const result = await compiler.serialize(
    <object>
      <property name="foo">bar</property>
    </object>
  );
  expect(result.contentType).toBe('view');
  expect(result.value).toStrictEqual({
    foo: 'bar',
  });
});

test('treats unknown objects as schema', async () => {
  const compiler = new DSLCompiler();
  const result = await compiler.serialize({
    foo: { bar: { type: 'StringType' } },
  });

  expect(result.contentType).toBe('schema');
  expect(result.value).toStrictEqual({
    ROOT: {
      foo: {
        type: 'fooType',
      },
    },
    fooType: {
      bar: {
        type: 'StringType',
      },
    },
  });
});

test('expressions in navigation', async () => {
  const compiler = new DSLCompiler();
  const navigation: Navigation = {
    BEGIN: 'Flow',
    onStart: e`foo`,
    Flow: {
      startState: 'VIEW_page',
      onStart: [e`foo`, e`foo`],
      VIEW_page: {
        onStart: {
          exp: e`foo`,
        },
        state_type: `VIEW`,
        ref: 'test',
        transitions: {
          '*': 'ShowView1Or2',
        },
      },
      ShowView1Or2: {
        state_type: 'ACTION',
        exp: e`foo`,
        transitions: {
          '*': 'VIEW_Other',
        },
      },
      END_back: {
        state_type: 'END',
        outcome: 'BACK',
      },
      END_done: {
        state_type: 'END',
        outcome: 'doneWithFlow',
      },
    },
  };
  const result = await compiler.serialize({ navigation });
  expect(result.value).toStrictEqual({
    navigation: {
      BEGIN: 'Flow',
      onStart: `foo`,
      Flow: {
        startState: 'VIEW_page',
        onStart: [`foo`, `foo`],
        VIEW_page: {
          onStart: {
            exp: `foo`,
          },
          state_type: `VIEW`,
          ref: 'test',
          transitions: {
            '*': 'ShowView1Or2',
          },
        },
        ShowView1Or2: {
          state_type: 'ACTION',
          exp: `foo`,
          transitions: {
            '*': 'VIEW_Other',
          },
        },
        END_back: {
          state_type: 'END',
          outcome: 'BACK',
        },
        END_done: {
          state_type: 'END',
          outcome: 'doneWithFlow',
        },
      },
    },
    views: [],
  });
});
