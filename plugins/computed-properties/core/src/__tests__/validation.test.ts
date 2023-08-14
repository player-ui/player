/* eslint-disable jest/expect-expect */
import { CommonExpressionsPlugin } from '@player-ui/common-expressions-plugin';
import { CommonTypesPlugin } from '@player-ui/common-types-plugin';
import { Registry } from '@player-ui/partial-match-registry';
import { AssetTransformPlugin } from '@player-ui/asset-transform-plugin';
import { makeFlow } from '@player-ui/make-flow';
import { Player } from '@player-ui/player';
import type {
  Asset,
  BindingInstance,
  TransformFunction,
  ValidationResponse,
} from '@player-ui/player';
import { ComputedPropertiesPlugin } from '..';

// This is a flow that uses computed properties for evaluating cross field validation
const flowWithComputedValidation = makeFlow({
  id: 'view-1',
  type: 'view',
  template: [
    {
      data: 'items',
      output: 'bindings',
      value: 'items._index_.isRelevant',
    },
  ],
  validation: [
    {
      type: 'expression',
      ref: 'items.0.isRelevant',
      message: 'Please select at least one item.',
      exp: '{{expressions.SelectionValidation}}',
    },
  ],
});

flowWithComputedValidation.schema = {
  ROOT: {
    items: {
      type: 'ItemType',
      isArray: true,
    },
    expressions: {
      type: 'ExpressionsType',
    },
  },
  itemType: {
    name: {
      type: 'TextType',
    },
    isRelevant: {
      type: 'BooleanType',
    },
  },
  ExpressionsType: {
    SelectionValidation: {
      type: 'Expression',
      exp: 'findProperty({{items}}, "isRelevant", true, "isRelevant", false)',
    },
  },
};

flowWithComputedValidation.data = {
  items: [
    {
      name: 'One',
      isRelevant: false,
    },
    {
      name: 'Two',
      isRelevant: false,
    },
  ],
};

interface ValidationView extends Asset<'view'> {
  /**
   *
   */
  bindings: string[];
}

/**
 *
 */
const validationTrackerTransform: TransformFunction<
  ValidationView,
  ValidationView & {
    /**
     *
     */
    validation?: ValidationResponse;
  }
> = (asset, options) => {
  const { bindings } = asset;
  let validation: ValidationResponse | undefined;

  // Setup tracking on each binding
  bindings.forEach((binding) => {
    validation =
      options.validation?.get(binding, { track: true }) ?? validation;
  });

  return {
    ...asset,
    validation,
  };
};

describe('cross field validation can use computed properties', () => {
  /**
   *
   */
  const baseValidationTest = (dataUpdate: Record<string, any>) => async () => {
    const player = new Player({
      plugins: [
        // necessary for data middleware to reference {{expressions}}
        new ComputedPropertiesPlugin(),

        // necessary for expression type validation
        new CommonTypesPlugin(),
        // necessary for findProperty
        new CommonExpressionsPlugin(),

        // necessary to track validations
        new AssetTransformPlugin(
          new Registry([[{ type: 'view' }, validationTrackerTransform]])
        ),
      ],
    });

    const result = player.start(flowWithComputedValidation);

    /**
     *
     */
    const getControllers = () => {
      const state = player.getState();
      if (state.status === 'in-progress') {
        return state.controllers;
      }
    };

    /**
     *
     */
    const getCurrentView = () => {
      const controllers = getControllers();
      return controllers ? controllers.view.currentView : undefined;
    };

    /**
     *
     */
    const withValidations = (
      assertions: (validations: {
        /**
         *
         */
        canTransition: boolean;
        /**
         *
         */
        validations?: Map<BindingInstance, ValidationResponse>;
      }) => void
    ) => assertions(getControllers()!.validation.validateView()!);

    expect(getCurrentView()?.initialView.id).toBe('view-1');

    withValidations(({ canTransition, validations }) => {
      expect(canTransition).toBe(false);
      expect(validations?.size).toBe(1);
    });

    getControllers()?.flow.transition('Next');

    // Transition fails do to blocking validation
    expect(getCurrentView()?.initialView.id).toBe('view-1');

    getControllers()?.data.set(dataUpdate);

    withValidations(({ canTransition, validations }) => {
      expect(canTransition).toBe(true);
      expect(validations).toBeUndefined();
    });

    getControllers()?.flow.transition('Next');

    const { endState } = await result;
    // eslint-disable-next-line jest/no-standalone-expect
    expect(endState).toStrictEqual({
      outcome: 'done',
      state_type: 'END',
    });
  };

  test(
    'updating ref data should remove validation',
    baseValidationTest({
      'items.0.isRelevant': true,
    })
  );

  test(
    'updating non-ref data should remove validation',
    baseValidationTest({
      'items.1.isRelevant': true,
    })
  );

  test(
    'updating both should remove validation',
    baseValidationTest({
      'items.0.isRelevant': true,
      'items.1.isRelevant': true,
    })
  );
});
