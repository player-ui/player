import { test, expect, describe } from "vitest";
import type { Expression } from "@player-ui/types";
import { CommonTypesPlugin } from "@player-ui/common-types-plugin";
import { Player } from "../../player";
import type { InProgressState } from "../../types";
import { BindingParser } from "../../binding";
import { LocalModel, withParser } from "../../data";
import { resolveDataRefs, resolveExpressionsInString } from "..";

test("works on basic data", () => {
  const localModel = new LocalModel({
    adam: {
      age: 26,
    },
    index: 1,
    person: {
      first: "adam",
      last: "dierkens",
    },
    name: "{{person.first}} {{person.last}}",
    pets: [
      {
        name: "frodo",
        type: "cat",
      },
      {
        name: "ginger",
        type: "dog",
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
    resolveDataRefs("Adam is {{adam.age}} years old", options),
  ).toStrictEqual("Adam is 26 years old");

  expect(
    resolveDataRefs("My name is {{person.first}} {{person.last}}", options),
  ).toStrictEqual("My name is adam dierkens");

  expect(resolveDataRefs("My name is {{name}}", options)).toStrictEqual(
    "My name is adam dierkens",
  );

  expect(resolveDataRefs("{{name}}", options)).toStrictEqual("adam dierkens");

  expect(
    resolveDataRefs('My cat is named {{pets[type="cat"].name}}', options),
  ).toStrictEqual("My cat is named frodo");

  expect(
    resolveDataRefs("Name: {{pets.{{index}}.name}}", options),
  ).toStrictEqual("Name: ginger");
});

test("replaces data w/ raw value if only data ref", () => {
  const localModel = new LocalModel({ foo: 100 });

  const bindingParser = new BindingParser({
    get: localModel.get,
    set: localModel.set,
    evaluate: () => undefined,
  });

  const model = withParser(localModel, bindingParser.parse);

  expect(
    resolveDataRefs("{{foo}}", {
      model,
      evaluate: (exp) => exp,
    }),
  ).toStrictEqual(100);
});

test("works on objects and arrays", () => {
  const localModel = new LocalModel({
    adam: {
      age: 26,
    },
    person: {
      first: "adam",
      last: "dierkens",
    },
    pets: [
      {
        name: "frodo",
        type: "cat",
      },
      {
        name: "ginger",
        type: "dog",
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
        "I have a {{pets.0.type}} named {{pets.0.name}}",
        "I have a {{pets.1.type}} named {{pets.1.name}}",
      ],
      {
        model,
        evaluate: (exp) => exp,
      },
    ),
  ).toStrictEqual(["I have a cat named frodo", "I have a dog named ginger"]);
});

test("handles undefined object", () => {
  const localModel = new LocalModel({
    adam: {
      age: 26,
    },
    person: {
      first: "adam",
      last: "dierkens",
    },
    pets: [
      {
        name: "frodo",
        type: "cat",
      },
      {
        name: "ginger",
        type: "dog",
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
    }),
  ).toBeNull();
});

test("resolves expressions", () => {
  const localModel = new LocalModel({
    adam: {
      age: 26,
    },
    index: 1,
    person: {
      first: "adam",
      last: "dierkens",
    },
    pets: [
      {
        name: "frodo",
        type: "cat",
      },
      {
        name: "ginger",
        type: "dog",
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
        return "adam dierkens";
      }

      if (exp === "{{adam.age}} + 10") {
        return 36;
      }
    },
  };

  expect(
    resolveExpressionsInString(
      'Hello @[{{person.first}} + " " + {{person.last}}]@',
      options,
    ),
  ).toBe("Hello adam dierkens");

  expect(resolveDataRefs("@[{{adam.age}} + 10]@", options)).toBe(36);
});

describe("Returns unformatted values for requests", () => {
  const player = new Player({ plugins: [new CommonTypesPlugin()] });

  const endStateFlow = {
    id: "minimal-player-response-format",
    topic: "MOCK",
    schema: {
      ROOT: {
        phoneNumber: {
          type: "PhoneType",
          default: "false",
        },
      },
    },
    data: {
      phoneNumber: "1234567890",
    },
    views: [
      {
        actions: [
          {
            asset: {
              id: "action-1",
              type: "action",
              value: "Next",
              label: {
                asset: {
                  id: "Action-Label-Next",
                  type: "text",
                  value: "Continue",
                },
              },
            },
          },
        ],
        id: "KitchenSink-View1",
        title: {
          asset: {
            id: "KitchenSink-View1-Title",
            type: "text",
            value: "{{phoneNumber}}",
          },
        },
        type: "questionAnswer",
      },
    ],
    navigation: {
      BEGIN: "KitchenSinkFlow",
      KitchenSinkFlow: {
        END_Done: {
          outcome: "{{phoneNumber}}",
          state_type: "END",
        },
        VIEW_KitchenSink_1: {
          ref: "KitchenSink-View1",
          state_type: "VIEW",
          transitions: {
            param: "END_invokeWithParam",
            "*": "END_Done",
          },
        },
        END_invokeWithParam: {
          state_type: "END",
          outcome: "{{phoneNumber}}",
          param: {
            type: "someTopic",
            topicId: "someTopicId",
            navData: {
              topic: "someTopic",
              op: "EDIT",
              param: {
                phone: "{{phoneNumber}}",
              },
            },
          },
        },
        startState: "VIEW_KitchenSink_1",
      },
    },
  };

  test("unformatted endState", async () => {
    player.start(endStateFlow as any);

    const state = player.getState() as InProgressState;

    state.controllers.flow.transition("foo");

    const { flowResult } = state;

    const result = await flowResult;

    expect(result.endState).toStrictEqual({
      outcome: "1234567890",
      state_type: "END",
    });
  });

  test('unformatted "param"', async () => {
    player.start(endStateFlow as any);

    const state = player.getState() as InProgressState;

    state.controllers.flow.transition("param");

    const { flowResult } = state;

    const result = await flowResult;

    const param = result.endState.param as any;

    expect(param.navData.param.phone).toBe("1234567890");
  });
});
