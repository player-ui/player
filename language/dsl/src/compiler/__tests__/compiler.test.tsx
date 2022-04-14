import React from 'react';
import { DSLCompiler } from '../compiler';

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
