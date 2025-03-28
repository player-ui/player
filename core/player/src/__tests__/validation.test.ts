import { test, expect, describe, it, beforeEach } from "vitest";
import { omit } from "timm";
import { makeFlow } from "@player-ui/make-flow";
import { vitest } from "vitest";
import type { Flow } from "@player-ui/types";
import type { SchemaController } from "../schema";
import type { BindingParser } from "../binding";
import TrackBindingPlugin, { addValidator } from "./helpers/binding.plugin";
import { Player } from "..";
import { VALIDATION_PROVIDER_NAME_SYMBOL } from "../controllers/validation";
import type { ValidationController } from "../controllers/validation";
import type { InProgressState } from "../types";
import TestExpressionPlugin, {
  RequiredIfValidationProviderPlugin,
} from "./helpers/expression.plugin";

const simpleFlow: Flow = {
  id: "test-flow",
  views: [
    {
      id: "view-1",
      type: "view",
      thing1: {
        asset: {
          type: "whatevs",
          id: "thing1",
          binding: "data.thing1",
        },
      },
      thing2: {
        asset: {
          type: "whatevs",
          id: "thing2",
          binding: "data.thing2",
        },
      },
    },
  ],
  data: {},
  schema: {
    ROOT: {
      data: {
        type: "DataType",
      },
    },
    DataType: {
      thing1: {
        type: "CatType",
        validation: [
          {
            type: "names",
            names: ["frodo", "sam"],
            trigger: "navigation",
            severity: "warning",
          },
        ],
      },
      thing2: {
        type: "CatType",
        validation: [
          {
            type: "names",
            trigger: "navigation",
            names: ["frodo", "sam"],
            severity: "warning",
          },
        ],
      },
    },
  },
  navigation: {
    BEGIN: "FLOW_1",
    FLOW_1: {
      startState: "VIEW_1",
      VIEW_1: {
        state_type: "VIEW",
        ref: "view-1",
        transitions: {
          "*": "END_1",
        },
      },
      END_1: {
        state_type: "END",
        outcome: "test",
      },
    },
  },
};

const simpleExpressionFlow: Flow = {
  id: "test-flow",
  views: [
    {
      id: "view-1",
      type: "view",
      foo: {
        asset: {
          type: "whatevs",
          id: "foo",
          binding: "data.foo",
        },
      },
      foo2: {
        asset: {
          type: "whatevs",
          id: "foo2",
          binding: "data.foo2",
        },
      },
      bar: {
        asset: {
          type: "whatevs",
          id: "bar",
          binding: "data.bar",
        },
      },
      bar2: {
        asset: {
          type: "whatevs",
          id: "bar2",
          binding: "data.bar2",
        },
      },
    },
  ],
  data: {},
  schema: {
    ROOT: {
      data: {
        type: "DataType",
      },
    },
    DataType: {
      foo: {
        type: "CatType",
        validation: [
          {
            type: "expression",
            exp: "!(isEmpty({{data.foo}}) && !isEmpty({{data.foo2}}))",
            severity: "warning",
          },
        ],
      },
      bar: {
        type: "CatType",
        validation: [
          {
            type: "expression",
            exp: "!(isEmpty({{data.bar}}) && !isEmpty({{data.bar2}}))",
            severity: "warning",
          },
        ],
      },
    },
  },
  navigation: {
    BEGIN: "FLOW_1",
    FLOW_1: {
      startState: "VIEW_1",
      VIEW_1: {
        state_type: "VIEW",
        ref: "view-1",
        transitions: {
          "*": "END_1",
        },
      },
      END_1: {
        state_type: "END",
        outcome: "test",
      },
    },
  },
};

const flowWithMultiNode: Flow = {
  id: "test-flow",
  views: [
    {
      id: "view-1",
      type: "view",
      multiNode: [
        {
          nestedMultiNode: [
            {
              asset: {
                type: "asset-type",
                id: "nested-asset",
                binding: "data.foo",
              },
            },
          ],
        },
      ],
    },
  ],
  data: {},
  schema: {
    ROOT: {
      data: {
        type: "DataType",
      },
    },
    DataType: {
      foo: {
        type: "CatType",
        validation: [
          {
            type: "names",
            names: ["frodo", "sam"],
            trigger: "navigation",
            severity: "warning",
          },
        ],
      },
    },
  },
  navigation: {
    BEGIN: "FLOW_1",
    FLOW_1: {
      startState: "VIEW_1",
      VIEW_1: {
        state_type: "VIEW",
        ref: "view-1",
        transitions: {
          "*": "END_1",
        },
      },
      END_1: {
        state_type: "END",
        outcome: "test",
      },
    },
  },
};

const flowWithThings: Flow = {
  id: "test-flow",
  views: [
    {
      id: "view-1",
      type: "view",
      thing1: {
        asset: {
          type: "whatevs",
          id: "thing1",
          binding: "data.thing1",
          applicability: "{{applicability.thing1}}",
        },
      },
      thing2: {
        asset: {
          type: "whatevs",
          id: "thing2",
          binding: "data.thing2",
          applicability: "{{applicability.thing2}}",
        },
      },
      thing3: {
        asset: {
          type: "whatevs",
          id: "thing3",
          applicability: "{{applicability.thing3}}",
          binding: "data.thing3",
          other: {
            asset: {
              type: "whatevs",
              id: "thing3a",
              binding: "data.thing3a",
              applicability: "{{applicability.thing3a}}",
            },
          },
        },
      },
      thing5: {
        asset: {
          type: "section",
          id: "thing5",
          binding: "data.thing5",
          applicability: "{{applicability.thing5}}",
          thing6: {
            asset: {
              type: "section",
              id: "thing6",
              binding: "data.thing6",
              applicability: "{{applicability.thing6}}",
              thing7: {
                asset: {
                  type: "whatevs",
                  id: "thing7",
                  binding: "data.thing7",
                  applicability: "{{applicability.thing7}}",
                },
              },
            },
          },
        },
      },
      alreadyInvalidData: {
        asset: {
          type: "invalid",
          id: "thing4",
          binding: "data.thing4",
        },
      },
    },
  ],
  data: {
    applicability: {
      thing1: true,
      thing2: true,
      thing3: true,
      thing3a: true,
      thing5: true,
      thing6: true,
      thing7: true,
    },
    data: {
      thing2: "frodo",
      thing4: "frodo",
    },
  },
  schema: {
    ROOT: {
      data: {
        type: "DataType",
      },
    },
    DataType: {
      thing2: {
        type: "CatType",
        validation: [
          {
            type: "names",
            names: ["frodo", "sam"],
          },
        ],
      },
      thing4: {
        type: "CatType",
        validation: [
          {
            type: "names",
            names: ["sam"],
          },
        ],
      },
      thing5: {
        type: "CatType",
        validation: [
          {
            type: "names",
            names: ["frodo"],
            displayTarget: "page",
          },
        ],
      },
      thing6: {
        type: "CatType",
        validation: [
          {
            type: "names",
            names: ["sam"],
            displayTarget: "section",
          },
        ],
      },
      thing7: {
        type: "CatType",
        validation: [
          {
            type: "names",
            names: ["bilbo"],
            displayTarget: "section",
          },
        ],
      },
    },
  },
  navigation: {
    BEGIN: "FLOW_1",
    FLOW_1: {
      startState: "VIEW_1",
      VIEW_1: {
        state_type: "VIEW",
        ref: "view-1",
        transitions: {
          "*": "END_1",
        },
      },
      END_1: {
        state_type: "END",
        outcome: "test",
      },
    },
  },
};

const flowWithApplicability: Flow = {
  id: "test-flow",
  views: [
    {
      id: "view-1",
      type: "view",
      thing1: {
        asset: {
          type: "whatevs",
          id: "thing1",
          binding: "dependentBinding",
        },
      },
      thing2: {
        asset: {
          type: "whatevs",
          id: "thing2",
          binding: "independentBinding",
        },
      },
      thing3: {
        asset: {
          type: "whatevs",
          id: "thing3",
          applicability: "{{independentBinding}} == true",
        },
      },
      validation: [
        {
          type: "requiredIf",
          ref: "dependentBinding",
          trigger: "load",
          param: "{{independentBinding}}",
          message: "required based on independent value",
        },
      ],
    },
  ],
  data: {},
  navigation: {
    BEGIN: "FLOW_1",
    FLOW_1: {
      startState: "VIEW_1",
      VIEW_1: {
        state_type: "VIEW",
        ref: "view-1",
        transitions: {
          "*": "END_1",
        },
      },
      END_1: {
        state_type: "END",
        outcome: "test",
      },
    },
  },
};

const flowWithItemsInArray: Flow = {
  id: "test-flow",
  views: [
    {
      id: "view-1",
      type: "view",
      pets: [
        {
          asset: {
            type: "whatevs",
            id: "thing1",
            binding: "pets.0.name",
          },
        },
        {
          asset: {
            type: "whatevs",
            id: "thing2",
            binding: "pets.1.name",
          },
        },
        {
          asset: {
            type: "whatevs",
            id: "thing2",
            binding: "pets.2.name",
          },
        },
      ],
    },
  ],
  data: {
    pets: [],
  },
  schema: {
    ROOT: {
      pets: {
        type: "PetType",
        isArray: true,
      },
    },
    PetType: {
      name: {
        type: "string",
        validation: [
          {
            type: "required",
          },
        ],
      },
    },
  },
  navigation: {
    BEGIN: "FLOW_1",
    FLOW_1: {
      startState: "VIEW_1",
      VIEW_1: {
        state_type: "VIEW",
        ref: "view-1",
        transitions: {
          "*": "END_1",
        },
      },
      END_1: {
        state_type: "END",
        outcome: "test",
      },
    },
  },
};

const multipleWarningsFlow: Flow = {
  id: "input-validation-flow",
  views: [
    {
      type: "view",
      id: "view",
      loadWarning: {
        asset: {
          id: "load-warning",
          type: "warning-asset",
          binding: "foo.load",
        },
      },
      navigationWarning: {
        asset: {
          id: "required-warning",
          type: "warning-asset",
          binding: "foo.navigation",
        },
      },
    },
  ],
  schema: {
    ROOT: {
      foo: {
        type: "FooType",
      },
    },
    FooType: {
      navigation: {
        type: "String",
        validation: [
          {
            type: "required",
            severity: "warning",
            blocking: "once",
            trigger: "navigation",
          },
        ],
      },
      load: {
        type: "String",
        validation: [
          {
            type: "required",
            severity: "warning",
            blocking: "once",
            trigger: "load",
          },
        ],
      },
    },
  },
  data: {},
  navigation: {
    BEGIN: "FLOW_1",
    FLOW_1: {
      startState: "VIEW_1",
      VIEW_1: {
        state_type: "VIEW",
        ref: "view",
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

const simpleFlowWithViewValidation: Flow = {
  id: "test-flow",
  views: [
    {
      id: "view-1",
      type: "view",
      thing1: {
        asset: {
          type: "whatevs",
          id: "thing1",
          binding: "data.thing1",
        },
      },
      validation: [
        {
          ref: "data.thing1",
          type: "expression",
          exp: "{{data.thing1}} > 50",
          trigger: "navigation",
          message: "Must be greater than 50",
        },
      ],
    },
  ],
  data: {},
  schema: {
    ROOT: {
      data: {
        type: "DataType",
      },
    },
    DataType: {
      thing1: {
        type: "IntegerType",
        validation: [
          {
            type: "required",
          },
        ],
      },
    },
  },
  navigation: {
    BEGIN: "FLOW_1",
    FLOW_1: {
      startState: "VIEW_1",
      VIEW_1: {
        state_type: "VIEW",
        ref: "view-1",
        transitions: {
          "*": "END_1",
        },
      },
      END_1: {
        state_type: "END",
        outcome: "test",
      },
    },
  },
};

test("alt APIs", async () => {
  const player = new Player();

  player.hooks.validationController.tap("test", (validationProvider) => {
    addValidator(validationProvider);
  });

  player.hooks.viewController.tap("test", (vc) => {
    vc.hooks.view.tap("test", (view) => {
      view.hooks.resolver.tap("test", (resolver) => {
        resolver.hooks.resolve.tap("test", (val, node, options) => {
          if (val.type === "section") {
            options.validation?.register({ type: "section" });
          }

          if (val?.binding) {
            return {
              ...val,
              validation: options.validation?.get(val.binding, { track: true }),
              childValidations: options.validation?.getChildren,
              sectionValidations: options.validation?.getValidationsForSection,
              allValidations: options.validation?.getAll(),
            };
          }

          return {
            ...val,
            childValidations: options.validation?.getChildren,
            groupValidations: options.validation?.getValidationsForSection,
            allValidations: options.validation?.getAll(),
          };
        });
      });
    });
  });
  player.start(flowWithThings);

  const state = player.getState() as InProgressState;

  // Starts out with nothing
  expect(
    state.controllers.view.currentView?.lastUpdate?.thing2.asset.validation,
  ).toBe(undefined);

  // Updates when data is updated to throw an error
  state.controllers.data.set([["data.thing2", "ginger"]]);
  await vitest.waitFor(() =>
    expect(
      state.controllers.view.currentView?.lastUpdate?.thing2.asset.validation,
    ).toMatchObject({
      severity: "error",
      message: `Names just be in: frodo,sam`,
      displayTarget: "field",
    }),
  );

  expect(
    Array.from(
      state.controllers.view.currentView?.lastUpdate?.thing2.asset.allValidations.values(),
    ),
  ).toMatchObject([
    {
      severity: "error",
      message: `Names just be in: frodo,sam`,
      displayTarget: "field",
    },
  ]);

  // check that the childValidations and sectionValidation computation works and
  state.controllers.data.set([["data.thing5", "sam"]]);
  state.controllers.data.set([["data.thing6", "frodo"]]);
  state.controllers.data.set([["data.thing7", "golumn"]]);

  // Gets all page errors for all children
  await vitest.waitFor(() =>
    expect(
      Array.from(
        state.controllers.view.currentView?.lastUpdate
          ?.childValidations("page")
          .values(),
      ),
    ).toMatchObject([
      {
        severity: "error",
        message: `Names just be in: frodo`,
        displayTarget: "page",
      },
    ]),
  );

  // Gets all section errors for all children
  expect(
    Array.from(
      state.controllers.view.currentView?.lastUpdate
        ?.childValidations("section")
        .values(),
    ),
  ).toMatchObject([
    {
      severity: "error",
      message: `Names just be in: sam`,
      displayTarget: "section",
    },
    {
      severity: "error",
      message: `Names just be in: bilbo`,
      displayTarget: "section",
    },
  ]);

  // Gets section error for child that is not wrapped in nested section
  expect(
    Array.from(
      state.controllers.view.currentView?.lastUpdate?.thing5.asset
        ?.sectionValidations()
        .values(),
    ),
  ).toMatchObject([
    {
      severity: "error",
      message: `Names just be in: sam`,
      displayTarget: "section",
    },
  ]);

  // Ensure that nested section still produces an error
  expect(
    Array.from(
      state.controllers.view.currentView?.lastUpdate?.thing5.asset.thing6.asset
        ?.sectionValidations()
        .values(),
    ),
  ).toMatchObject([
    {
      severity: "error",
      message: `Names just be in: bilbo`,
      displayTarget: "section",
    },
  ]);
});

describe("validation", () => {
  let player: Player;
  let validationController: ValidationController;
  let schema: SchemaController;
  let parser: BindingParser;

  beforeEach(() => {
    player = new Player({
      plugins: [new TrackBindingPlugin()],
    });
    player.hooks.validationController.tap("test", (vc) => {
      validationController = vc;
    });
    player.hooks.schema.tap("test", (s) => {
      schema = s;
    });
    player.hooks.bindingParser.tap("test", (p) => {
      parser = p;
    });

    player.start(flowWithThings);
  });

  describe("binding tracker", () => {
    it("tracks bindings in the view", () => {
      expect(validationController?.getBindings().size).toStrictEqual(8);
    });

    it("preserves tracked bindings for non-updated things", () => {
      expect(validationController?.getBindings().size).toStrictEqual(8);

      (player.getState() as InProgressState).controllers.data.set([
        ["not.there", false],
      ]);
      expect(validationController?.getBindings().size).toStrictEqual(8);
    });

    it("drops bindings for non-applicable things", async () => {
      expect(validationController?.getBindings().size).toStrictEqual(8);

      (player.getState() as InProgressState).controllers.data.set([
        ["applicability.thing3", false],
      ]);

      await vitest.waitFor(() =>
        expect(validationController?.getBindings().size).toStrictEqual(6),
      );
    });

    it("track bindings in nested multi nodes", async () => {
      player.start(flowWithMultiNode);

      await vitest.waitFor(() =>
        expect(validationController?.getBindings().size).toStrictEqual(1),
      );
    });
  });

  describe("schema", () => {
    it("tests the types right", () => {
      expect(schema.getType(parser.parse("data.thing2"))?.type).toBe("CatType");
    });
  });

  describe("data model delete", () => {
    it("deletes the validation when the data is deleted", async () => {
      const state = player.getState() as InProgressState;

      const { validation, data, binding, view } = state.controllers;
      const thing2Binding = binding.parse("data.thing2");

      expect(validation.getBindings().has(thing2Binding)).toBe(true);

      await vitest.waitFor(() => {
        expect(
          view.currentView?.lastUpdate?.thing2.asset.validation,
        ).toBeUndefined();
      });

      data.set([["data.thing2", "gandalf"]]);

      await vitest.waitFor(() => {
        expect(
          view.currentView?.lastUpdate?.thing2.asset.validation?.message,
        ).toBe("Names just be in: frodo,sam");
      });

      data.delete("data.thing2");
      expect(data.get("data.thing2", { includeInvalid: true })).toBe(undefined);

      await vitest.waitFor(() => {
        expect(
          view.currentView?.lastUpdate?.thing2.asset.validation,
        ).toBeUndefined();
      });

      data.set([["data.thing2", "gandalf"]]);
      await vitest.waitFor(() => {
        expect(
          view.currentView?.lastUpdate?.thing2.asset.validation?.message,
        ).toBe("Names just be in: frodo,sam");
      });
    });

    it("handles arrays", async () => {
      player.start(flowWithItemsInArray);
      const state = player.getState() as InProgressState;
      const { data, binding, view } = state.controllers;

      await vitest.waitFor(() => {
        expect(
          view.currentView?.lastUpdate?.pets[1].asset.validation,
        ).toBeUndefined();
      });

      // Trigger validation for the second item
      data.set([["pets.1.name", ""]]);
      expect(
        schema.getType(binding.parse("pets.1.name"))?.validation,
      ).toHaveLength(1);

      await vitest.waitFor(() => {
        expect(
          view.currentView?.lastUpdate?.pets[1].asset.validation?.message,
        ).toBe("A value is required");
      });

      // Delete the first item, the items should shift up and validation moves to the first item
      data.delete("pets.0");

      await vitest.waitFor(() => {
        expect(
          view.currentView?.lastUpdate?.pets[1].asset.validation,
        ).toBeUndefined();
        expect(
          view.currentView?.lastUpdate?.pets[0].asset.validation?.message,
        ).toBe("A value is required");
      });
    });
  });

  describe("state", () => {
    it("updates when setting data", async () => {
      const state = player.getState() as InProgressState;

      // Starts out with nothing
      expect(
        state.controllers.view.currentView?.lastUpdate?.thing2.asset.validation,
      ).toBe(undefined);

      // Updates when data is updated to throw an error
      state.controllers.data.set([["data.thing2", "ginger"]]);
      await vitest.waitFor(() =>
        expect(
          state.controllers.view.currentView?.lastUpdate?.thing2.asset
            .validation,
        ).toMatchObject({
          severity: "error",
          message: `Names just be in: frodo,sam`,
          displayTarget: "field",
        }),
      );

      // Back to nothing when the error is fixed
      state.controllers.data.set([["data.thing2", "frodo"]]);
      await vitest.waitFor(() =>
        expect(
          state.controllers.view.currentView?.lastUpdate?.thing2.asset
            .validation,
        ).toBe(undefined),
      );
    });
  });

  describe("validation object", () => {
    it("returns the whole validation object", async () => {
      const state = player.getState() as InProgressState;

      // Starts out with nothing
      expect(
        state.controllers.view.currentView?.lastUpdate?.thing2.asset.validation,
      ).toBe(undefined);

      // Updates when data is updated to throw an error
      state.controllers.data.set([["data.thing2", "ginger"]]);
      await vitest.waitFor(() =>
        expect(
          state.controllers.view.currentView?.lastUpdate?.thing2.asset
            .validation,
        ).toStrictEqual({
          severity: "error",
          message: `Names just be in: frodo,sam`,
          names: ["frodo", "sam"],
          displayTarget: "field",
          trigger: "change",
          type: "names",
          blocking: true,
          [VALIDATION_PROVIDER_NAME_SYMBOL]: "schema",
        }),
      );

      // Back to nothing when the error is fixed
      state.controllers.data.set([["data.thing2", "frodo"]]);
      await vitest.waitFor(() =>
        expect(
          state.controllers.view.currentView?.lastUpdate?.thing2.asset
            .validation,
        ).toBe(undefined),
      );
    });
  });

  describe("navigation", () => {
    it("prevents navigation for pre-existing invalid data", async () => {
      const state = player.getState() as InProgressState;
      const { flowResult } = state;
      // Starts out with nothing
      expect(
        state.controllers.view.currentView?.lastUpdate?.alreadyInvalidData.asset
          .validation,
      ).toBe(undefined);

      // Try to transition
      state.controllers.flow.transition("foo");

      // Stays on the same view
      expect(
        state.controllers.flow.current?.currentState?.value.state_type,
      ).toBe("VIEW");

      // Fix the error.
      state.controllers.data.set([["data.thing4", "sam"]]);
      state.controllers.data.set([["data.thing5", "frodo"]]);
      state.controllers.data.set([["data.thing6", "sam"]]);
      state.controllers.data.set([["data.thing7", "bilbo"]]);

      // Try to transition again
      state.controllers.flow.transition("foo");

      // Should work now that there's no error
      const result = await flowResult;
      expect(result.endState.outcome).toBe("test");
    });

    it("block navigation after data changes on first input, show warning on second input, then navigation succeeds", async () => {
      player.start(simpleFlow);
      const state = player.getState() as InProgressState;
      const { flowResult } = state;
      // Starts out with nothing
      expect(
        state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
      ).toBe(undefined);

      expect(
        state.controllers.view.currentView?.lastUpdate?.thing2.asset.validation,
      ).toBe(undefined);

      state.controllers.data.set([["data.thing1", "sam"]]);

      // Try to transition
      state.controllers.flow.transition("foo");

      // Stays on the same view
      expect(
        state.controllers.flow.current?.currentState?.value.state_type,
      ).toBe("VIEW");

      expect(
        state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
      ).toBe(undefined);

      expect(
        state.controllers.view.currentView?.lastUpdate?.thing2.asset.validation,
      ).not.toBe(undefined);

      state.controllers.data.set([["data.thing1", "bilbo"]]);

      // Try to transition
      state.controllers.flow.transition("foo");

      // Should transition to end since data changes already occured on first input
      expect(
        state.controllers.flow.current?.currentState?.value.state_type,
      ).toBe("END");

      // Should work now that there's no error
      const result = await flowResult;
      expect(result.endState.outcome).toBe("test");
    });
    it("doesnt remove existing expression warnings if a new warning is triggered", async () => {
      player.hooks.expressionEvaluator.tap("test", (evaluator) => {
        evaluator.addExpressionFunction("isEmpty", (ctx: any, val: any) => {
          if (val === undefined || val === null) {
            return true;
          }

          if (typeof val === "string") {
            return val.length === 0;
          }

          return false;
        });
      });
      player.start(simpleExpressionFlow);
      const state = player.getState() as InProgressState;
      const { flowResult } = state;
      // Starts out with nothing
      expect(
        state.controllers.view.currentView?.lastUpdate?.foo.asset.validation,
      ).toBe(undefined);

      expect(
        state.controllers.view.currentView?.lastUpdate?.bar.asset.validation,
      ).toBe(undefined);

      state.controllers.data.set([["data.foo2", "someData"]]);

      // Try to transition
      state.controllers.flow.transition("foo");

      // Stays on the same view
      expect(
        state.controllers.flow.current?.currentState?.value.state_type,
      ).toBe("VIEW");

      expect(
        state.controllers.view.currentView?.lastUpdate?.foo.asset.validation,
      ).not.toBe(undefined);

      expect(
        state.controllers.view.currentView?.lastUpdate?.foo2.asset.validation,
      ).toBe(undefined);

      expect(
        state.controllers.view.currentView?.lastUpdate?.bar.asset.validation,
      ).toBe(undefined);

      expect(
        state.controllers.view.currentView?.lastUpdate?.bar2.asset.validation,
      ).toBe(undefined);

      state.controllers.data.set([["data.bar2", "someData"]]);

      // Try to transition
      state.controllers.flow.transition("foo");

      // Stays on the same view
      expect(
        state.controllers.flow.current?.currentState?.value.state_type,
      ).toBe("VIEW");

      // existing validation
      // FAILS HERE
      expect(
        state.controllers.view.currentView?.lastUpdate?.foo.asset.validation,
      ).not.toBe(undefined);

      expect(
        state.controllers.view.currentView?.lastUpdate?.foo2.asset.validation,
      ).toBe(undefined);

      // new validation
      expect(
        state.controllers.view.currentView?.lastUpdate?.bar.asset.validation,
      ).not.toBe(undefined);

      expect(
        state.controllers.view.currentView?.lastUpdate?.bar2.asset.validation,
      ).toBe(undefined);

      state.controllers.data.set([["data.foo", "frodo"]]);
      state.controllers.data.set([["data.bar", "sam"]]);

      // Try to transition again
      state.controllers.flow.transition("foo");

      // Should work now that there's no error
      const result = await flowResult;
      expect(result.endState.outcome).toBe("test");
    });

    it("autodismiss if data change already took place on input with warning, manually dismiss second warning", async () => {
      player.start(simpleFlow);
      const state = player.getState() as InProgressState;
      const { flowResult } = state;
      // Starts out with nothing
      expect(
        state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
      ).toBe(undefined);

      expect(
        state.controllers.view.currentView?.lastUpdate?.thing2.asset.validation,
      ).toBe(undefined);

      state.controllers.data.set([["data.thing1", "sam"]]);

      // Try to transition
      state.controllers.flow.transition("foo");

      // Stays on the same view
      expect(
        state.controllers.flow.current?.currentState?.value.state_type,
      ).toBe("VIEW");

      expect(
        state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
      ).toBe(undefined);

      expect(
        state.controllers.view.currentView?.lastUpdate?.thing2.asset.validation,
      ).not.toBe(undefined);

      state.controllers.data.set([["data.thing1", "bilbo"]]);
      state.controllers.view.currentView?.lastUpdate?.thing2.asset.validation.dismiss();

      // Try to transition
      state.controllers.flow.transition("foo");

      // Since data change (setting "sam") already triggered validation next step is auto dismiss
      expect(
        state.controllers.flow.current?.currentState?.value.state_type,
      ).toBe("END");

      // Should work now that there's no error
      const result = await flowResult;
      expect(result.endState.outcome).toBe("test");
    });

    it("should auto-dismiss when dismissal is triggered", async () => {
      player.start(multipleWarningsFlow);
      const state = player.getState() as InProgressState;
      const { flowResult } = state;
      // Starts with one warning
      expect(
        state.controllers.view.currentView?.lastUpdate?.loadWarning.asset
          .validation,
      ).toBeDefined();

      expect(
        state.controllers.view.currentView?.lastUpdate?.navigationWarning.asset
          .validation,
      ).toBeUndefined();

      // Try to transition
      state.controllers.flow.transition("next");

      // Stays on the same view
      expect(
        state.controllers.flow.current?.currentState?.value.state_type,
      ).toBe("VIEW");

      // new warning appears
      expect(
        state.controllers.view.currentView?.lastUpdate?.loadWarning.asset
          .validation,
      ).toBeDefined();

      expect(
        state.controllers.view.currentView?.lastUpdate?.navigationWarning.asset
          .validation,
      ).toBeDefined();

      // Try to transition
      state.controllers.flow.transition("next");

      // Since data change (setting "sam") already triggered validation next step is auto dismiss
      expect(
        state.controllers.flow.current?.currentState?.value.state_type,
      ).toBe("END");

      // Should work now that there's no error
      const result = await flowResult;
      expect(result.endState.outcome).toBe("done");
    });
  });

  describe("introspection and filtering", () => {
    /**
     *
     */
    const getAllKnownValidations = () => {
      const allBindings = validationController.getBindings();
      const allValidations = Array.from(allBindings).flatMap((b) => {
        const validatedBinding =
          validationController.getValidationForBinding(b);

        if (!validatedBinding) {
          return [];
        }

        return validatedBinding.allValidations.map((v) => {
          return {
            binding: b,
            validation: v,
            response: validationController.validationRunner(v.value, b),
          };
        });
      });

      return allValidations;
    };

    it("can query all triggered validations", async () => {
      const state = player.getState() as InProgressState;
      state.controllers.data.set([["data.thing4", "not-sam"]]);

      await vitest.waitFor(() => {
        expect(
          state.controllers.view.currentView?.lastUpdate?.alreadyInvalidData
            .asset.validation.message,
        ).toBe("Names just be in: sam");
      });

      const currentValidations = getAllKnownValidations();

      expect(currentValidations).toHaveLength(5);
      expect(
        currentValidations[0]?.validation.value[
          VALIDATION_PROVIDER_NAME_SYMBOL
        ],
      ).toBe("schema");
    });

    it("can compute new validations without dismissing existing ones", async () => {
      const updatedFlow = {
        ...flowWithThings,
        views: [
          {
            ...flowWithThings.views?.[0],
            validation: [
              {
                type: "expression",
                ref: "data.thing2",
                message: "Both need to equal 100",
                exp: "{{data.thing1}} + {{data.thing2}} == 100",
              },
            ],
          },
        ],
      };

      player.start(updatedFlow as any);
      const currentValidations = getAllKnownValidations();
      expect(currentValidations).toHaveLength(6);
    });
  });
});

describe("cross-field validation", () => {
  const crossFieldFlow = makeFlow({
    id: "view-1",
    type: "view",
    thing1: {
      asset: {
        id: "thing-1",
        binding: "foo.data.thing1",
        type: "input",
      },
    },
    thing2: {
      asset: {
        id: "thing-2",
        binding: "foo.data.thing2",
        type: "input",
      },
    },
    validation: [
      {
        type: "expression",
        ref: "foo.data.thing1",
        message: "Both need to equal 100",
        exp: "{{foo.data.thing1}} + {{foo.data.thing2}} == 100",
      },
    ],
  });

  it("works for navigate triggers", async () => {
    const player = new Player({
      plugins: [new TrackBindingPlugin()],
    });
    player.start(crossFieldFlow);
    const state = player.getState() as InProgressState;

    // Validation starts as nothing
    expect(
      state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
    ).toBe(undefined);

    // Updating a thing is still nothing (haven't navigated yet)
    state.controllers.data.set([["foo.data.thing1", 20]]);
    expect(
      state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
    ).toBe(undefined);

    // Try to navigate, should show the validation now
    state.controllers.flow.transition("next");
    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      "VIEW",
    );
    expect(
      state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
    ).toMatchObject({
      severity: "error",
      message: "Both need to equal 100",
      displayTarget: "field",
    });

    // Updating a thing is still nothing (haven't navigated yet)
    state.controllers.data.set([["foo.data.thing2", 85]]);
    expect(
      state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
    ).toMatchObject({
      severity: "error",
      message: "Both need to equal 100",
      displayTarget: "field",
    });

    // Set it equal to 100 and continue on
    state.controllers.data.set([["foo.data.thing2", 80]]);
    state.controllers.flow.transition("next");

    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      "END",
    );
  });

  it("takes precedence over schema validation for the same binding", async () => {
    const player = new Player({
      plugins: [new TrackBindingPlugin()],
    });
    player.start(simpleFlowWithViewValidation);
    const state = player.getState() as InProgressState;

    // Validation starts as nothing
    expect(
      state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
    ).toBe(undefined);

    // Try to navigate, should show the validation now
    state.controllers.flow.transition("next");
    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      "VIEW",
    );
    expect(
      state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
    ).toMatchObject({
      severity: "error",
      message: "Must be greater than 50",
      displayTarget: "field",
    });

    // Updating a thing is still nothing (haven't navigated yet)
    state.controllers.data.set([["data.thing1", 51]]);
    expect(
      state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
    ).toMatchObject({
      severity: "error",
      message: "Must be greater than 50",
      displayTarget: "field",
    });

    // Set it equal to 100 and continue on
    state.controllers.flow.transition("next");

    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      "END",
    );
  });
});

test("shows errors on load", () => {
  const errFlow = makeFlow({
    id: "view-1",
    type: "view",
    thing1: {
      asset: {
        id: "thing-1",
        binding: "foo.data.thing1",
        type: "input",
      },
    },
    validation: [
      {
        type: "required",
        ref: "foo.data.thing1",
        message: "Stuffs broken",
        trigger: "load",
        severity: "error",
      },
    ],
  });

  const player = new Player({ plugins: [new TrackBindingPlugin()] });
  player.start(errFlow);
  const state = player.getState() as InProgressState;

  // Validation starts with a warning on load
  expect(
    state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
  ).toMatchObject({
    message: "Stuffs broken",
    severity: "error",
    displayTarget: "field",
  });
});

describe("errors", () => {
  const errorFlow = makeFlow({
    id: "view-1",
    type: "view",
    thing1: {
      asset: {
        id: "thing-1",
        binding: "foo.data.thing1",
        type: "input",
      },
    },
    validation: [
      {
        type: "required",
        ref: "foo.data.thing1",
        trigger: "load",
        severity: "error",
      },
    ],
  });
  const nonBlockingErrorFlow = makeFlow({
    id: "view-1",
    type: "view",
    thing1: {
      asset: {
        id: "thing-1",
        binding: "foo.data.thing1",
        type: "input",
      },
    },
    validation: [
      {
        type: "required",
        ref: "foo.data.thing1",
        trigger: "load",
        severity: "error",
        blocking: false,
      },
    ],
  });
  const onceBlockingErrorFlow = makeFlow({
    id: "view-1",
    type: "view",
    thing1: {
      asset: {
        id: "thing-1",
        binding: "foo.data.thing1",
        type: "input",
      },
    },
    validation: [
      {
        type: "required",
        ref: "foo.data.thing1",
        trigger: "navigation",
        severity: "error",
        blocking: "once",
      },
    ],
  });

  const oneInputWithErrorOnLoadBlockingFalseAndWarningNavigationTriggerFlow =
    makeFlow({
      id: "view-1",
      type: "view",
      thing1: {
        asset: {
          id: "thing-1",
          binding: "foo.data.thing1",
          type: "input",
        },
      },
      validation: [
        {
          type: "required",
          ref: "foo.data.thing1",
          severity: "error",
          trigger: "load",
          blocking: "false",
        },
        {
          type: "required",
          ref: "foo.data.thing1",
          trigger: "navigation",
          severity: "warning",
        },
      ],
    });

  const oneInputWithErrorOnLoadBlockingFalseAndWarningChangeTriggerFlow =
    makeFlow({
      id: "view-1",
      type: "view",
      thing1: {
        asset: {
          id: "thing-1",
          binding: "foo.data.thing1",
          type: "input",
        },
      },
      validation: [
        {
          type: "required",
          ref: "foo.data.thing1",
          severity: "error",
          trigger: "load",
          blocking: "false",
        },
        {
          type: "required",
          ref: "foo.data.thing1",
          trigger: "change",
          severity: "warning",
        },
      ],
    });

  it("blocks navigation by default", async () => {
    const player = new Player({ plugins: [new TrackBindingPlugin()] });
    player.start(errorFlow);
    const state = player.getState() as InProgressState;

    // Try to navigate, should prevent the navigation and display the error
    state.controllers.flow.transition("next");
    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      "VIEW",
    );
    expect(
      state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
    ).toMatchObject({
      message: "A value is required",
      severity: "error",
      displayTarget: "field",
    });

    // Try to navigate, should prevent the navigation and keep displaying the error
    state.controllers.flow.transition("next");
    // We make it to the next state
    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      "VIEW",
    );
  });
  it("blocking once allows navigation on second attempt", async () => {
    const player = new Player({ plugins: [new TrackBindingPlugin()] });
    player.start(onceBlockingErrorFlow);
    const state = player.getState() as InProgressState;

    // Try to navigate, should prevent the navigation and display the error
    state.controllers.flow.transition("next");
    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      "VIEW",
    );
    expect(
      state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
    ).toMatchObject({
      message: "A value is required",
      severity: "error",
      displayTarget: "field",
    });

    // Navigate _again_ this should dismiss it
    state.controllers.flow.transition("next");
    // We make it to the next state
    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      "END",
    );
  });

  it("error on load blocking false then warning with change trigger on navigation attempt", async () => {
    const player = new Player({ plugins: [new TrackBindingPlugin()] });
    player.start(
      oneInputWithErrorOnLoadBlockingFalseAndWarningChangeTriggerFlow,
    );
    const state = player.getState() as InProgressState;

    expect(
      state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
    ).toMatchObject({
      message: "A value is required",
      severity: "error",
      displayTarget: "field",
    });

    // Try to navigate, should prevent the navigation and display the warning
    state.controllers.flow.transition("next");
    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      "VIEW",
    );

    expect(
      state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
    ).toMatchObject({
      message: "A value is required",
      severity: "warning",
      displayTarget: "field",
    });

    // Navigate _again_ this should dismiss it
    state.controllers.flow.transition("next");
    // We make it to the next state

    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      "END",
    );
  });

  it("error on load blocking false then warning on navigation attempt", async () => {
    const player = new Player({ plugins: [new TrackBindingPlugin()] });
    player.start(
      oneInputWithErrorOnLoadBlockingFalseAndWarningNavigationTriggerFlow,
    );
    const state = player.getState() as InProgressState;

    expect(
      state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
    ).toMatchObject({
      message: "A value is required",
      severity: "error",
      displayTarget: "field",
    });

    // Try to navigate, should prevent the navigation and display the warning
    state.controllers.flow.transition("next");
    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      "VIEW",
    );

    expect(
      state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
    ).toMatchObject({
      message: "A value is required",
      severity: "warning",
      displayTarget: "field",
    });

    // Navigate _again_ this should dismiss it
    state.controllers.flow.transition("next");
    // We make it to the next state

    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      "END",
    );
  });

  it("error on load blocking false then input active then warning on navigation attempt", async () => {
    const player = new Player({ plugins: [new TrackBindingPlugin()] });
    player.start(
      oneInputWithErrorOnLoadBlockingFalseAndWarningNavigationTriggerFlow,
    );
    const state = player.getState() as InProgressState;

    expect(
      state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
    ).toMatchObject({
      message: "A value is required",
      severity: "error",
      displayTarget: "field",
    });

    // Type something to dismiss the error, should be empty to see the warning
    state.controllers.data.set([["foo.data.thing1", ""]]);

    // Try to navigate, should prevent the navigation and display the warning
    state.controllers.flow.transition("next");
    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      "VIEW",
    );

    expect(
      state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
    ).toMatchObject({
      message: "A value is required",
      severity: "warning",
      displayTarget: "field",
    });

    // Navigate _again_ this should dismiss it
    state.controllers.flow.transition("next");
    // We make it to the next state

    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      "END",
    );
  });

  it("blocking false allows navigation", async () => {
    const player = new Player({ plugins: [new TrackBindingPlugin()] });
    player.start(nonBlockingErrorFlow);
    const state = player.getState() as InProgressState;

    // Try to navigate, should allow navigation because blocking is false
    state.controllers.flow.transition("next");
    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      "END",
    );
  });
  it("blocking false still shows validation", async () => {
    const player = new Player({ plugins: [new TrackBindingPlugin()] });
    player.start(nonBlockingErrorFlow);
    const state = player.getState() as InProgressState;

    expect(
      state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
    ).toMatchObject({
      message: "A value is required",
      severity: "error",
      displayTarget: "field",
    });

    // Try to navigate, should allow navigation because blocking is false
    state.controllers.flow.transition("next");
    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      "END",
    );
  });
});

test("validations return non-blocking errors", async () => {
  const flow = makeFlow({
    id: "view-1",
    type: "view",
    blocking: {
      asset: {
        id: "thing-1",
        binding: "foo.blocking",
        type: "input",
      },
    },
    nonblocking: {
      asset: {
        id: "thing-2",
        binding: "foo.nonblocking",
        type: "input",
      },
    },
  });

  flow.schema = {
    ROOT: {
      foo: {
        type: "FooType",
      },
    },
    FooType: {
      blocking: {
        type: "TestType",
        validation: [
          {
            type: "required",
          },
        ],
      },
      nonblocking: {
        type: "TestType",
        validation: [
          {
            type: "required",
            blocking: false,
          },
        ],
      },
    },
  };

  const player = new Player({ plugins: [new TrackBindingPlugin()] });
  player.start(flow);

  /**
   *
   */
  const getState = () => player.getState() as InProgressState;

  /**
   *
   */
  const getCurrentView = () =>
    getState().controllers.view.currentView?.lastUpdate;

  // No errors show up initially

  await vitest.waitFor(() => {
    expect(getState().controllers.view.currentView?.lastUpdate?.id).toBe(
      "view-1",
    );
  });

  expect(getCurrentView()?.blocking.asset.validation).toBeUndefined();
  expect(getCurrentView()?.nonblocking.asset.validation).toBeUndefined();

  getState().controllers.flow.transition("next");
  expect(
    getState().controllers.flow.current?.currentState?.value.state_type,
  ).toBe("VIEW");

  expect(player.getState().status).toBe("in-progress");

  await vitest.waitFor(() => {
    expect(getCurrentView()?.blocking.asset.validation).toMatchObject({
      message: "A value is required",
      severity: "error",
      displayTarget: "field",
    });

    expect(getCurrentView()?.nonblocking.asset.validation).toMatchObject({
      message: "A value is required",
      severity: "error",
      displayTarget: "field",
    });
  });

  getState().controllers.data.set([["foo.blocking", "foo"]]);

  await vitest.waitFor(() => {
    expect(getCurrentView()?.blocking.asset.validation).toBeUndefined();

    expect(getCurrentView()?.nonblocking.asset.validation).toMatchObject({
      message: "A value is required",
      severity: "error",
      displayTarget: "field",
    });
  });

  getState().controllers.flow.transition("next");

  await vitest.waitFor(() => {
    expect(player.getState().status).toBe("completed");
  });
});

describe("warnings", () => {
  const warningFlowOnNavigation = makeFlow({
    id: "view-1",
    type: "view",
    thing1: {
      asset: {
        id: "thing-1",
        binding: "foo.data.thing1",
        type: "input",
      },
    },
    validation: [
      {
        type: "required",
        ref: "foo.data.thing1",
        trigger: "navigation",
        severity: "warning",
      },
    ],
  });

  const warningFlowOnLoad = makeFlow({
    id: "view-1",
    type: "view",
    thing1: {
      asset: {
        id: "thing-1",
        binding: "foo.data.thing1",
        type: "input",
      },
    },
    validation: [
      {
        type: "required",
        ref: "foo.data.thing1",
        trigger: "load",
        severity: "warning",
      },
    ],
  });

  const blockingWarningFlow = makeFlow({
    id: "view-1",
    type: "view",
    thing1: {
      asset: {
        id: "thing-1",
        binding: "foo.data.thing1",
        type: "input",
      },
    },
    validation: [
      {
        type: "required",
        ref: "foo.data.thing1",
        trigger: "load",
        blocking: true,
        severity: "warning",
      },
    ],
  });

  const onceBlockingWarningFlow = makeFlow({
    id: "view-1",
    type: "view",
    thing1: {
      asset: {
        id: "thing-1",
        binding: "foo.data.thing1",
        type: "input",
      },
    },
    validation: [
      {
        type: "required",
        ref: "foo.data.thing1",
        trigger: "navigation",
        blocking: "once",
        severity: "warning",
      },
    ],
  });

  const onceBlockingWarningFlowWithChangeTrigger = makeFlow({
    id: "view-1",
    type: "view",
    thing1: {
      asset: {
        id: "thing-1",
        binding: "foo.data.thing1",
        type: "input",
      },
    },
    validation: [
      {
        type: "required",
        ref: "foo.data.thing1",
        trigger: "change",
        blocking: "once",
        severity: "warning",
      },
    ],
  });

  it("shows warnings on load", () => {
    const player = new Player({ plugins: [new TrackBindingPlugin()] });
    player.start(warningFlowOnLoad);
    const state = player.getState() as InProgressState;

    // Validation starts with a warning on load
    expect(
      omit(
        state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
        "dismiss",
      ),
    ).toMatchObject({
      message: "A value is required",
      severity: "warning",
      displayTarget: "field",
    });
  });

  it("auto-dismiss on double-navigation", async () => {
    const player = new Player({ plugins: [new TrackBindingPlugin()] });
    player.start(warningFlowOnNavigation);
    const state = player.getState() as InProgressState;

    // Try to navigate, should prevent the navigation and keep the warning
    state.controllers.flow.transition("next");
    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      "VIEW",
    );
    expect(
      omit(
        state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
        "dismiss",
      ),
    ).toMatchObject({
      message: "A value is required",
      severity: "warning",
      displayTarget: "field",
    });

    // Navigate _again_ this should dismiss it
    state.controllers.flow.transition("next");
    // We make it to the next state
    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      "END",
    );
  });

  it("should dismiss triggered navigation warnings on change", async () => {
    const player = new Player({ plugins: [new TrackBindingPlugin()] });
    player.start(warningFlowOnNavigation);
    const state = player.getState() as InProgressState;

    // Try to navigate, should prevent the navigation and keep the warning
    state.controllers.flow.transition("next");
    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      "VIEW",
    );
    expect(
      state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
    ).toMatchObject(
      expect.objectContaining({
        message: "A value is required",
        severity: "warning",
        displayTarget: "field",
      }),
    );

    state.controllers.data.set([["foo.data.thing1", "value"]]);

    await vitest.waitFor(() => {
      expect(
        state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
      ).toBeUndefined();
    });
  });

  it("blocking warnings dont auto-dismiss on double-navigation", async () => {
    const player = new Player({ plugins: [new TrackBindingPlugin()] });
    player.start(blockingWarningFlow);
    const state = player.getState() as InProgressState;

    // Try to navigate, should prevent the navigation and keep the warning
    state.controllers.flow.transition("next");
    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      "VIEW",
    );
    expect(
      omit(
        state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
        "dismiss",
      ),
    ).toMatchObject({
      message: "A value is required",
      severity: "warning",
      displayTarget: "field",
    });

    // Navigate _again_ this should dismiss it
    state.controllers.flow.transition("next");
    // We make it to the next state
    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      "VIEW",
    );
  });

  it("warnings do not stop data saving", () => {
    const flow = makeFlow({
      asset: {
        id: "input-2",
        type: "input",
        binding: "person.name",
        label: {
          asset: {
            id: "input-2-label",
            type: "text",
            value: "Name",
          },
        },
      },
    });

    flow.schema = {
      ROOT: {
        person: {
          type: "PersonType",
        },
      },
      PersonType: {
        name: {
          type: "StringType",
          validation: [
            {
              type: "names",
              names: ["frodo", "sam"],
              severity: "warning",
            },
          ],
        },
      },
    };

    const player = new Player({
      plugins: [new TrackBindingPlugin()],
    });
    player.start(flow);
    const state = player.getState() as InProgressState;

    state.controllers.data.set([["person.name", "peter"]], {
      formatted: true,
    });

    expect(
      state.controllers.data.get("person.name", { includeInvalid: false }),
    ).toBe("peter");
  });

  it("errors still do stop data saving", () => {
    const flow = makeFlow({
      asset: {
        id: "input-2",
        type: "input",
        binding: "person.name",
        label: {
          asset: {
            id: "input-2-label",
            type: "text",
            value: "Name",
          },
        },
      },
    });

    flow.schema = {
      ROOT: {
        person: {
          type: "PersonType",
        },
      },
      PersonType: {
        name: {
          type: "StringType",
          validation: [
            {
              type: "names",
              names: ["frodo", "sam"],
            },
          ],
        },
      },
    };

    const player = new Player({
      plugins: [new TrackBindingPlugin()],
    });
    player.start(flow);
    const state = player.getState() as InProgressState;

    state.controllers.data.set([["person.name", "peter"]], {
      formatted: true,
    });

    expect(
      state.controllers.data.get("person.name", { includeInvalid: false }),
    ).toBe(undefined);
  });

  it("once blocking warnings auto-dismiss on double-navigation", async () => {
    const player = new Player({ plugins: [new TrackBindingPlugin()] });
    player.start(onceBlockingWarningFlow);
    const state = player.getState() as InProgressState;

    // Try to navigate, should prevent the navigation and keep the warning
    state.controllers.flow.transition("next");
    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      "VIEW",
    );
    expect(
      omit(
        state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
        "dismiss",
      ),
    ).toMatchObject({
      message: "A value is required",
      severity: "warning",
      displayTarget: "field",
    });

    // Navigate _again_ this should dismiss it
    state.controllers.flow.transition("next");
    // We make it to the next state

    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      "END",
    );
  });

  it("once blocking warnings with change trigger auto-dismiss on double-navigation", async () => {
    const player = new Player({ plugins: [new TrackBindingPlugin()] });
    player.start(onceBlockingWarningFlowWithChangeTrigger);
    const state = player.getState() as InProgressState;

    // Validation starts with no warnings on load
    expect(
      state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
    ).toBeUndefined();

    // Try to navigate, should prevent the navigation and show the warning
    state.controllers.flow.transition("next");
    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      "VIEW",
    );
    expect(
      omit(
        state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
        "dismiss",
      ),
    ).toMatchObject({
      message: "A value is required",
      severity: "warning",
      displayTarget: "field",
    });

    // Navigate _again_ this should dismiss it
    state.controllers.flow.transition("next");
    // We make it to the next state

    await vitest.waitFor(() => {
      expect(
        state.controllers.flow.current?.currentState?.value.state_type,
      ).toBe("END");
    });
  });

  it("triggers re-render on dismiss call", () => {
    const player = new Player({ plugins: [new TrackBindingPlugin()] });
    player.start(warningFlowOnLoad);
    const state = player.getState() as InProgressState;

    // Validation starts with a warning on load
    expect(
      omit(
        state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
        "dismiss",
      ),
    ).toMatchObject({
      message: "A value is required",
      severity: "warning",
      displayTarget: "field",
    });

    state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation.dismiss();
    expect(
      state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
    ).toBe(undefined);

    // Should be able to navigate w/o issues
    state.controllers.flow.transition("next");
    // We make it to the next state
    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      "END",
    );
  });
});

describe("validation within arrays", () => {
  const arrayFlow = makeFlow({
    id: "view-1",
    type: "view",
    thing1: {
      asset: {
        id: "thing-1",
        binding: "thing.1.data.3.name",
        type: "input",
      },
    },
    thing2: {
      asset: {
        id: "thing-2",
        binding: "thing.2.data.0.name",
        type: "input",
      },
    },
  });

  arrayFlow.schema = {
    ROOT: {
      thing: {
        type: "ThingType",
        isArray: true,
      },
    },
    ThingType: {
      data: {
        type: "DataType",
        isArray: true,
      },
    },
    DataType: {
      name: {
        type: "StringType",
        validation: [
          {
            type: "required",
          },
        ],
      },
    },
  };

  it("validates things correctly within an array", async () => {
    const player = new Player({ plugins: [new TrackBindingPlugin()] });
    player.start(arrayFlow);
    const state = player.getState() as InProgressState;

    // Nothing initially
    expect(
      state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
    ).toBe(undefined);
    expect(
      state.controllers.view.currentView?.lastUpdate?.thing2.asset.validation,
    ).toBe(undefined);

    // Error if set to an falsy value
    state.controllers.data.set([["thing.1.data.3.name", ""]]);
    await vitest.waitFor(() => {
      expect(
        state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
      ).toMatchObject({
        severity: "error",
        message: "A value is required",
        displayTarget: "field",
      });
      expect(
        state.controllers.view.currentView?.lastUpdate?.thing2.asset.validation,
      ).toBe(undefined);
    });

    // Other one gets error if i try to navigate
    state.controllers.data.set([["thing.1.data.3.name", "adam"]]);
    state.controllers.flow.transition("anything");
    await vitest.waitFor(() => {
      expect(
        state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
      ).toBe(undefined);
      expect(
        state.controllers.view.currentView?.lastUpdate?.thing2.asset.validation,
      ).toMatchObject({
        severity: "error",
        message: "A value is required",
        displayTarget: "field",
      });
    });
  });
});

describe("models can get valid or invalid data", () => {
  const flow = makeFlow({
    asset: {
      id: "input-2",
      type: "input",
      binding: "person.name",
      label: {
        asset: {
          id: "input-2-label",
          type: "text",
          value: "Name",
        },
      },
    },
  });

  flow.schema = {
    ROOT: {
      person: {
        type: "PersonType",
      },
    },
    PersonType: {
      name: {
        type: "StringType",
        validation: [
          {
            type: "names",
            names: ["frodo", "sam"],
          },
        ],
      },
    },
  };

  it("gets both", () => {
    const player = new Player({ plugins: [new TrackBindingPlugin()] });
    player.start(flow);
    const state = player.getState() as InProgressState;

    state.controllers.data.set([["person.name", "adam"]]);

    expect(state.controllers.data.get("person.name")).toBe(undefined);
    expect(
      state.controllers.data.get("person.name", { includeInvalid: true }),
    ).toBe("adam");

    state.controllers.data.set([["person.name", "sam"]]);
    expect(state.controllers.data.get("person.name")).toBe("sam");
    expect(
      state.controllers.data.get("person.name", { includeInvalid: true }),
    ).toBe("sam");
  });
});

test("validations can run against formatted or deformatted values", async () => {
  const flow = makeFlow({
    asset: {
      id: "input-2",
      type: "input",
      binding: "person.name",
      label: {
        asset: {
          id: "input-2-label",
          type: "text",
          value: "Name",
        },
      },
    },
  });

  flow.schema = {
    ROOT: {
      person: {
        type: "PersonType",
      },
    },
    PersonType: {
      name: {
        type: "NumberType",
        format: {
          type: "indexOf",
          options: ["frodo", "sam"],
        },
        validation: [
          {
            type: "names",
            dataTarget: "formatted",
            names: ["frodo", "sam"],
          },
        ],
      },
    },
  };

  const player = new Player({ plugins: [new TrackBindingPlugin()] });

  player.start(flow);
  const state = player.getState() as InProgressState;

  state.controllers.data.set([["person.name", 0]]);
  expect(state.controllers.data.get("person.name")).toBe(0);
  expect(
    state.controllers.view.currentView?.lastUpdate?.validation,
  ).toBeUndefined();

  state.controllers.data.set([["person.name", "adam"]], { formatted: true });
  await vitest.waitFor(() => {
    expect(
      state.controllers.view.currentView?.lastUpdate?.validation.message,
    ).toBe("Names just be in: frodo,sam");
  });

  state.controllers.data.set([["person.name", "sam"]], { formatted: true });
  await vitest.waitFor(() => {
    expect(
      state.controllers.view.currentView?.lastUpdate?.validation,
    ).toBeUndefined();
  });
});

test("tracking a binding commits the default value", () => {
  const flow = makeFlow({
    asset: {
      id: "input-2",
      type: "input",
      binding: "person.name",
      label: {
        asset: {
          id: "input-2-label",
          type: "text",
          value: "{{other.name}}",
        },
      },
    },
  });

  flow.schema = {
    ROOT: {
      person: {
        type: "PersonType",
      },
      other: {
        type: "PersonType",
      },
    },
    PersonType: {
      name: {
        type: "StringType",
        default: "Adam",
      },
    },
  };

  const player = new Player({ plugins: [new TrackBindingPlugin()] });

  player.start(flow);
  const state = player.getState() as InProgressState;
  expect(state.controllers.data.get("person.name")).toBe("Adam");
  expect(state.controllers.data.get("other.name")).toBe("Adam");
  expect(
    state.controllers.view.currentView?.lastUpdate?.label.asset.value,
  ).toBe("Adam");
  expect(state.controllers.data.get("")).toStrictEqual({
    person: { name: "Adam" },
  });
});

test("does not validate on expressions outside of view", async () => {
  const flowWithExp: Flow = {
    id: "flow-with-exp",
    views: [
      {
        id: "view-1",
        type: "view",
        fields: {
          asset: {
            id: "input",
            type: "input",
            binding: "person.name",
          },
        },
      },
    ],
    data: { person: { name: "frodo" } },
    schema: {
      ROOT: {
        person: {
          type: "PersonType",
        },
      },
      PersonType: {
        name: {
          type: "String",
          validation: [
            {
              type: "names",
              dataTarget: "formatted",
              names: ["frodo", "sam"],
            },
          ],
        },
      },
    },
    navigation: {
      BEGIN: "FLOW_1",
      FLOW_1: {
        startState: "VIEW_1",
        VIEW_1: {
          state_type: "VIEW",
          ref: "view-1",
          transitions: {
            "*": "ACTION_1",
          },
        },
        ACTION_1: {
          state_type: "ACTION",
          exp: '{{person.name}} = "invalid"',
          transitions: {
            "*": "END_1",
          },
        },
        END_1: {
          state_type: "END",
          outcome: "done",
        },
      },
    },
  };

  const player = new Player({ plugins: [new TrackBindingPlugin()] });
  const outcome = player.start(flowWithExp);

  const state = player.getState() as InProgressState;
  state.controllers.flow.transition("Next");

  const response = await outcome;
  expect(response.data).toStrictEqual({ person: { name: "invalid" } });
});

describe("Validation applicability", () => {
  let player: Player;

  beforeEach(() => {
    player = new Player({
      plugins: [
        new TrackBindingPlugin(),
        new RequiredIfValidationProviderPlugin(),
      ],
    });

    player.start(flowWithApplicability);
  });

  describe("weak validation", () => {
    it("weak binding updates should be allowed despite strong validation errors", async () => {
      const state = player.getState() as InProgressState;

      state.controllers.data.set([["independentBinding", true]]);
      await vitest.waitFor(() => {
        expect(state.controllers.data.get("independentBinding")).toStrictEqual(
          true,
        );
        expect(
          state.controllers.view.currentView?.lastUpdate?.thing1.asset
            .validation,
        ).toMatchObject({
          severity: "error",
          message: `required based on independent value`,
        });
      });

      state.controllers.data.set([["dependentBinding", "foo"]]);
      await vitest.waitFor(() => {
        expect(state.controllers.data.get("dependentBinding")).toStrictEqual(
          "foo",
        );
        expect(
          state.controllers.view.currentView?.lastUpdate?.thing1.asset
            .validation,
        ).toBeUndefined();
      });

      state.controllers.data.set([["dependentBinding", undefined]]);
      await vitest.waitFor(() => {
        expect(
          state.controllers.view.currentView?.lastUpdate?.thing1.asset
            .validation,
        ).toMatchObject({
          severity: "error",
          message: `required based on independent value`,
        });
      });

      state.controllers.data.set([["independentBinding", false]]);
      await vitest.waitFor(() => {
        expect(state.controllers.data.get("independentBinding")).toStrictEqual(
          false,
        );
        expect(
          state.controllers.view.currentView?.lastUpdate?.thing1.asset
            .validation,
        ).toMatchObject({
          severity: "error",
          message: `required based on independent value`,
        });
      });
    });
  });
});

test("updating a binding only updates its data and not other bindings due to weak binding connections", async () => {
  const flow = makeFlow({
    id: "view-1",
    type: "view",
    thing1: {
      asset: {
        id: "thing-1",
        binding: "input.text",
      },
    },
    thing2: {
      asset: {
        id: "thing-2",
        binding: "input.check",
      },
    },
    validation: [
      {
        type: "requiredIf",
        ref: "input.text",
        param: "input.check",
      },
    ],
  });

  flow.data = {
    someOtherParam: "notFoo",
  };

  flow.schema = {
    ROOT: {
      input: {
        type: "InputType",
      },
    },
    InputType: {
      text: {
        type: "DateType",
        validation: [
          {
            type: "paramIsFoo",
            param: "someOtherParam",
          },
        ],
      },
      check: {
        type: "BooleanType",
        validation: [
          {
            type: "required",
          },
        ],
      },
    },
  };

  const basicValidationPlugin = {
    name: "basic-validation",
    apply: (player: Player) => {
      player.hooks.schema.tap("basic-validation", (schema) => {
        schema.addDataTypes([
          {
            type: "DateType",
            validation: [{ type: "date" }],
          },
          {
            type: "BooleanType",
            validation: [{ type: "boolean" }],
          },
        ]);
      });

      player.hooks.validationController.tap("basic-validation", (vc) => {
        vc.hooks.createValidatorRegistry.tap("basic-validation", (registry) => {
          registry.register("date", (ctx, value) => {
            if (value === undefined) {
              return;
            }

            return value.match(/^\d{4}-\d{2}-\d{2}$/)
              ? undefined
              : { message: "Not a date" };
          });
          registry.register("boolean", (ctx, value) => {
            if (value === undefined || value === true || value === false) {
              return;
            }

            return {
              message: "Not a boolean",
            };
          });

          registry.register("required", (ctx, value) => {
            if (value === undefined) {
              return {
                message: "Required",
              };
            }
          });

          registry.register<any>("requiredIf", (ctx, value, { param }) => {
            const paramValue = ctx.model.get(param);
            if (paramValue === undefined) {
              return;
            }

            if (value === undefined) {
              return {
                message: "Required",
              };
            }
          });

          registry.register<any>("paramIsFoo", (ctx, value, { param }) => {
            const paramValue = ctx.model.get(param);
            if (paramValue === "foo") {
              return;
            }

            if (value === undefined) {
              return {
                message: "Must be foo",
              };
            }
          });
        });
      });
    },
  };

  const player = new Player({
    plugins: [new TrackBindingPlugin(), basicValidationPlugin],
  });
  player.start(flow);
  const state = player.getState() as InProgressState;

  state.controllers.flow.transition("next");
  await vitest.waitFor(() => {
    state.controllers.data.set([["input.text", ""]]);
  });

  await vitest.waitFor(() => {
    state.controllers.data.set([["input.check", true]]);
  });

  await vitest.waitFor(() => {
    const finalState = player.getState() as InProgressState;
    const otherParam = finalState.controllers.data.get("someOtherParam");
    expect(otherParam).toBe("notFoo");
  });
});

describe("Validations with custom field messages", () => {
  it("can evaluate expressions in message", async () => {
    const flow = makeFlow({
      id: "view-1",
      type: "view",
      thing1: {
        asset: {
          id: "thing-1",
          binding: "foo.data.thing1",
          type: "input",
        },
      },
      validation: [
        {
          type: "expression",
          ref: "foo.data.thing1",
          message: "The entered value {{foo.data.thing1}} is greater than 100",
          exp: "{{foo.data.thing1}} < 100",
        },
      ],
    });
    const player = new Player({
      plugins: [new TrackBindingPlugin()],
    });
    player.start(flow);
    const state = player.getState() as InProgressState;

    state.controllers.data.set([["foo.data.thing1", 200]]);
    state.controllers.flow.transition("next");
    expect(
      state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
    ).toMatchObject({
      severity: "error",
      message: "The entered value 200 is greater than 100",
      displayTarget: "field",
    });
  });

  it("can templatize messages", async () => {
    const errFlow = makeFlow({
      id: "view-1",
      type: "view",
      thing1: {
        asset: {
          id: "thing-1",
          binding: "foo.data.thing1",
          type: "integer",
        },
      },
      validation: [
        {
          type: "integer",
          ref: "foo.data.thing1",
          message:
            "foo.data.thing1 is a number. You have provided a value of %type, which is correct. But floored value, %flooredValue is not equal to entered value, %value",
          trigger: "load",
          severity: "error",
        },
      ],
    });

    const player = new Player({ plugins: [new TrackBindingPlugin()] });
    player.start(errFlow);
    const state = player.getState() as InProgressState;

    state.controllers.data.set([["foo.data.thing1", 200.567]]);

    await vitest.waitFor(() => {
      expect(
        state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
      ).toMatchObject({
        message:
          "foo.data.thing1 is a number. You have provided a value of number, which is correct. But floored value, 200 is not equal to entered value, 200.567",
        severity: "error",
        displayTarget: "field",
      });
    });
  });
});

describe("Validations with multiple inputs", () => {
  const complexValidation = makeFlow({
    id: "view-1",
    type: "view",
    thing1: {
      asset: {
        id: "thing-1",
        binding: "foo.a",
        type: "input",
      },
    },
    thing2: {
      asset: {
        id: "thing-2",
        binding: "foo.b",
        type: "input",
      },
    },
    validation: [
      {
        type: "expression",
        ref: "foo.a",
        message: "Both need to equal 100",
        exp: 'sumValues(["foo.a", "foo.b"]) == 100',
        severity: "error",
        trigger: "load",
      },
    ],
  });

  let player: Player;

  beforeEach(() => {
    player = new Player({
      plugins: [new TrackBindingPlugin(), new TestExpressionPlugin()],
    });

    player.start(flowWithThings);
  });

  it("Throws errors when a weak referenced field is changed", async () => {
    complexValidation.data = {
      foo: {
        a: 90,
        b: 10,
      },
    };

    player.start(complexValidation);
    const state = player.getState() as InProgressState;

    expect(
      state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
    ).toBeUndefined();

    state.controllers.data.set([["foo.b", 70]]);
    await vitest.waitFor(() => {
      expect(
        state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
      ).toMatchObject({
        severity: "error",
        message: "Both need to equal 100",
      });

      expect(state.controllers.data.get("")).toMatchObject({
        foo: {
          a: 90,
          b: 70,
        },
      });
    });
  });

  it("Clears errors when a weak referenced field is changed", async () => {
    complexValidation.data = {
      foo: {
        a: 90,
        b: 10,
      },
    };

    player.start(complexValidation);
    const state = player.getState() as InProgressState;

    expect(
      state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
    ).toBeUndefined();

    state.controllers.data.set([["foo.a", 15]]);
    await vitest.waitFor(() => {
      expect(
        state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
      ).toMatchObject({
        severity: "error",
        message: "Both need to equal 100",
      });

      expect(
        state.controllers.data.get("", { includeInvalid: false }),
      ).toMatchObject({
        foo: {
          a: 90,
          b: 10,
        },
      });

      expect(
        state.controllers.data.get("", { includeInvalid: true }),
      ).toMatchObject({
        foo: {
          a: 15,
          b: 10,
        },
      });
    });

    state.controllers.data.set([["foo.b", 85]]);
    await vitest.waitFor(() => {
      expect(
        state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
      ).toBeUndefined();

      expect(
        state.controllers.data.get("", { includeInvalid: false }),
      ).toMatchObject({
        foo: {
          a: 15,
          b: 85,
        },
      });

      expect(
        state.controllers.data.get("", { includeInvalid: true }),
      ).toMatchObject({
        foo: {
          a: 15,
          b: 85,
        },
      });
    });
  });
});

describe("weak binding edge cases", () => {
  test("requiredIf", async () => {
    const flow = makeFlow({
      id: "view-1",
      type: "view",
      thing1: {
        asset: {
          id: "thing-1",
          binding: "input.text",
        },
      },
      thing2: {
        asset: {
          id: "thing-2",
          binding: "input.check",
        },
      },
      validation: [
        {
          type: "requiredIf",
          ref: "input.text",
          param: "input.check",
        },
      ],
    });

    flow.schema = {
      ROOT: {
        input: {
          type: "InputType",
        },
      },
      InputType: {
        text: {
          type: "DateType",
        },
        check: {
          type: "BooleanType",
          validation: [
            {
              type: "required",
            },
          ],
        },
      },
    };

    const basicValidationPlugin = {
      name: "basic-validation",
      apply: (player: Player) => {
        player.hooks.schema.tap("basic-validation", (schema) => {
          schema.addDataTypes([
            {
              type: "DateType",
              validation: [{ type: "date" }],
            },
            {
              type: "BooleanType",
              validation: [{ type: "boolean" }],
            },
          ]);
        });

        player.hooks.validationController.tap("basic-validation", (vc) => {
          vc.hooks.createValidatorRegistry.tap(
            "basic-validation",
            (registry) => {
              registry.register("date", (ctx, value) => {
                if (value === undefined) {
                  return;
                }

                return value.match(/^\d{4}-\d{2}-\d{2}$/)
                  ? undefined
                  : { message: "Not a date" };
              });
              registry.register("boolean", (ctx, value) => {
                if (value === undefined || value === true || value === false) {
                  return;
                }

                return {
                  message: "Not a boolean",
                };
              });

              registry.register("required", (ctx, value) => {
                if (value === undefined) {
                  return {
                    message: "Required",
                  };
                }
              });

              registry.register<any>("requiredIf", (ctx, value, { param }) => {
                const paramValue = ctx.model.get(param);
                if (paramValue === undefined) {
                  return;
                }

                if (value === undefined) {
                  return {
                    message: "Required",
                  };
                }
              });
            },
          );
        });
      },
    };

    const player = new Player({
      plugins: [new TrackBindingPlugin(), basicValidationPlugin],
    });
    player.start(flow);
    const state = player.getState() as InProgressState;

    state.controllers.flow.transition("next");
    await vitest.waitFor(() => {
      state.controllers.data.set([["input.text", "1999-12-31"]]);
    });
    await vitest.waitFor(() => {
      state.controllers.data.set([["input.check", true]]);
    });
    await vitest.waitFor(() => {
      state.controllers.flow.transition("next");
    });
    await vitest.waitFor(() => {
      expect(player.getState().status).toBe("completed");
    });
  });
});

describe("Validation Providers", () => {
  it("uses a locally defined handler", async () => {
    let shouldError = true;

    const player = new Player({
      plugins: [
        new TrackBindingPlugin(),

        {
          name: "basic-validation",
          apply: (p: Player) => {
            p.hooks.validationController.tap("basic-validation", (vc) => {
              vc.hooks.resolveValidationProviders.tap(
                "basic-validation",
                (providers) => {
                  return [
                    ...providers,
                    {
                      source: "local-test",
                      provider: {
                        getValidationsForBinding(binding) {
                          if (binding.asString() === "data.thing1") {
                            return [
                              {
                                type: "custom",
                                trigger: "load",
                                severity: "error",
                                handler: (ctx, value) => {
                                  if (shouldError) {
                                    return {
                                      message: "Local Error",
                                    };
                                  }
                                },
                              },
                            ];
                          }
                        },
                      },
                    },
                  ];
                },
              );
            });
          },
        },
      ],
    });

    player.start(simpleFlow);

    /**
     *
     */
    const getControllers = () => {
      const state = player.getState() as InProgressState;
      return state.controllers;
    };

    /**
     *
     */
    const getFirstInput = () => {
      return getControllers().view.currentView?.lastUpdate?.thing1.asset;
    };

    expect(getFirstInput()?.validation?.message).toBe("Local Error");
    getControllers().data.set([["data.thing1", "foo"]]);
    expect(getFirstInput()?.validation?.message).toBe("Local Error");

    shouldError = false;

    getControllers().data.set([["data.thing1", "sam"]]);

    await vitest.waitFor(() => {
      expect(getFirstInput()?.validation?.message).toBe(undefined);
    });
  });
});

describe("Validation + Default Data", () => {
  it("triggers validation default data is invalid", async () => {
    const flow = makeFlow({
      id: "view-1",
      type: "view",
      requiredField: {
        asset: {
          id: "required-field",
          type: "input",
          binding: "input.text",
        },
      },
      thing2: {
        asset: {
          id: "thing-2",
          binding: "input.check",
        },
      },
      validation: [
        {
          type: "requiredIf",
          ref: "input.text",
          param: "input.check",
        },
      ],
    });

    flow.schema = {
      ROOT: {
        input: {
          type: "InputType",
        },
      },
      InputType: {
        text: {
          type: "StringType",
          // The default value is an empty string, which is invalid b/c of the required check
          default: "",
          validation: [
            {
              type: "required",
            },
          ],
        },
      },
    };

    const player = new Player({
      plugins: [new TrackBindingPlugin()],
    });

    player.start(flow);

    /**
     *
     */
    const getControllers = () => {
      const state = player.getState() as InProgressState;
      return state.controllers;
    };

    /**
     *
     */
    const getFirstInput = () => {
      return getControllers().view.currentView?.lastUpdate?.requiredField.asset;
    };

    await vitest.waitFor(() => {
      expect(getFirstInput()?.validation).toBeUndefined();
    });

    // Set the value to the same as the default
    getControllers().data.set([["input.text", ""]]);

    await vitest.waitFor(() => {
      expect(getFirstInput()?.validation.message).toBe("A value is required");
    });

    // Set the value to something else
    getControllers().data.set([["input.text", "foo"]]);
    await vitest.waitFor(() => {
      expect(getFirstInput()?.validation).toBeUndefined();
    });
  });
});

describe("Validation in subflow", () => {
  it("validations are evaluated when in a subflow", async () => {
    const flow = {
      id: "input-validation-flow",
      views: [
        {
          id: "view-1",
          type: "input",
          binding: "foo.requiredInput",
          label: {
            asset: {
              id: "input-required-label",
              type: "text",
              value: "This input is required",
            },
          },
        },
      ],
      schema: {
        ROOT: {
          foo: {
            type: "FooType",
          },
        },
        FooType: {
          requiredInput: {
            type: "StringType",
            validation: [
              {
                type: "required",
              },
            ],
          },
        },
      },
      data: {},
      navigation: {
        BEGIN: "FLOW_1",
        FLOW_1: {
          startState: "SUBFLOW",
          SUBFLOW: {
            state_type: "FLOW",
            ref: "FLOW_2",
            transitions: {
              "*": "END_Done",
            },
          },
          END_Done: {
            state_type: "END",
            outcome: "done",
          },
        },
        FLOW_2: {
          startState: "VIEW_1",
          VIEW_1: {
            state_type: "VIEW",
            ref: "view-1",
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
    } as Flow;

    const player = new Player({
      plugins: [new TrackBindingPlugin()],
    });

    player.start(flow);

    /**
     *
     */
    const getControllers = () => {
      const state = player.getState() as InProgressState;
      return state.controllers;
    };

    /**
     *
     */
    const getValidationMessage = () => {
      return getControllers().view.currentView?.lastUpdate?.validation;
    };

    /**
     *
     */
    const attemptTransition = () => {
      getControllers().flow.transition("next");
    };

    await vitest.waitFor(() => {
      expect(getControllers().view.currentView?.lastUpdate?.id).toStrictEqual(
        "view-1",
      );
    });

    attemptTransition();
    expect(getControllers().view.currentView?.lastUpdate?.id).toStrictEqual(
      "view-1",
    );
    const firstRequiredValidation = getValidationMessage();
    expect(firstRequiredValidation.message).toStrictEqual(
      "A value is required",
    );
    getControllers().data.set([["foo.requiredInput", 1]]);

    await vitest.waitFor(() => {
      attemptTransition();
    });

    await vitest.waitFor(() => {
      expect(player.getState().status).toStrictEqual("completed");
    });
  });
});
