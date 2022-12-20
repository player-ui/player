import type { Expression } from '@player-ui/types';

import { BindingParser } from '../../binding';
import { LocalModel, withParser } from '../../data';
import { resolveDataRefs, resolveExpressionsInString } from '..';

test('works on basic data', () => {
  const localModel = new LocalModel({
    adam: {
      age: 26,
    },
    index: 1,
    person: {
      first: 'adam',
      last: 'dierkens',
    },
    name: '{{person.first}} {{person.last}}',
    pets: [
      {
        name: 'frodo',
        type: 'cat',
      },
      {
        name: 'ginger',
        type: 'dog',
      },
    ],
  });

  const bindingParser = new BindingParser({
    get: localModel.get,
    set: localModel.set,
    evaluate: () => undefined,
  });

  const model = withParser(localModel, bindingParser.parse);

  const options = {
    model,
    evaluate: (exp: Expression) => exp,
  };

  expect(
    resolveDataRefs('Adam is {{adam.age}} years old', options)
  ).toStrictEqual('Adam is 26 years old');

  expect(
    resolveDataRefs('My name is {{person.first}} {{person.last}}', options)
  ).toStrictEqual('My name is adam dierkens');

  expect(resolveDataRefs('My name is {{name}}', options)).toStrictEqual(
    'My name is adam dierkens'
  );

  expect(resolveDataRefs('{{name}}', options)).toStrictEqual('adam dierkens');

  expect(
    resolveDataRefs('My cat is named {{pets[type="cat"].name}}', options)
  ).toStrictEqual('My cat is named frodo');

  expect(
    resolveDataRefs('Name: {{pets.{{index}}.name}}', options)
  ).toStrictEqual('Name: ginger');
});

test('replaces data w/ raw value if only data ref', () => {
  const localModel = new LocalModel({ foo: 100 });

  const bindingParser = new BindingParser({
    get: localModel.get,
    set: localModel.set,
    evaluate: () => undefined,
  });

  const model = withParser(localModel, bindingParser.parse);

  expect(
    resolveDataRefs('{{foo}}', {
      model,
      evaluate: (exp) => exp,
    })
  ).toStrictEqual(100);
});

test('works on objects and arrays', () => {
  const localModel = new LocalModel({
    adam: {
      age: 26,
    },
    person: {
      first: 'adam',
      last: 'dierkens',
    },
    pets: [
      {
        name: 'frodo',
        type: 'cat',
      },
      {
        name: 'ginger',
        type: 'dog',
      },
    ],
  });

  const bindingParser = new BindingParser({
    get: localModel.get,
    set: localModel.set,
    evaluate: () => undefined,
  });

  const model = withParser(localModel, bindingParser.parse.bind(bindingParser));

  expect(
    resolveDataRefs(
      [
        'I have a {{pets.0.type}} named {{pets.0.name}}',
        'I have a {{pets.1.type}} named {{pets.1.name}}',
      ],
      {
        model,
        evaluate: (exp) => exp,
      }
    )
  ).toStrictEqual(['I have a cat named frodo', 'I have a dog named ginger']);
});

test('handles undefined object', () => {
  const localModel = new LocalModel({
    adam: {
      age: 26,
    },
    person: {
      first: 'adam',
      last: 'dierkens',
    },
    pets: [
      {
        name: 'frodo',
        type: 'cat',
      },
      {
        name: 'ginger',
        type: 'dog',
      },
    ],
  });

  const bindingParser = new BindingParser({
    get: localModel.get,
    set: localModel.set,
    evaluate: () => undefined,
  });

  const model = withParser(localModel, bindingParser.parse.bind(bindingParser));

  expect(
    resolveDataRefs(null, {
      model,
      evaluate: (exp) => exp,
    })
  ).toBeNull();
});

test('resolves expressions', () => {
  const localModel = new LocalModel({
    adam: {
      age: 26,
    },
    index: 1,
    person: {
      first: 'adam',
      last: 'dierkens',
    },
    pets: [
      {
        name: 'frodo',
        type: 'cat',
      },
      {
        name: 'ginger',
        type: 'dog',
      },
    ],
  });

  const bindingParser = new BindingParser({
    get: localModel.get,
    set: localModel.set,
    evaluate: () => undefined,
  });

  const model = withParser(localModel, bindingParser.parse);

  const options = {
    model,
    evaluate: (exp: Expression) => {
      if (exp === '{{person.first}} + " " + {{person.last}}') {
        return 'adam dierkens';
      }

      if (exp === '{{adam.age}} + 10') {
        return 36;
      }
    },
  };

  expect(
    resolveExpressionsInString(
      'Hello @[{{person.first}} + " " + {{person.last}}]@',
      options
    )
  ).toBe('Hello adam dierkens');

  expect(resolveDataRefs('@[{{adam.age}} + 10]@', options)).toBe(36);
});
