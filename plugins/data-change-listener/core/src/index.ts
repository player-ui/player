import type {
  Player,
  DataController,
  PlayerPlugin,
  View,
  ViewController,
  ExpressionType,
  ExpressionEvaluator,
  BindingInstance,
  BindingParser,
} from "@player-ui/player";
import { isExpressionNode } from "@player-ui/player";

const LISTENER_TYPES = {
  dataChange: "dataChange.",
};

const WILDCARD_REGEX = /\._\.|\._$/;

/** View with view level listeners that can do arbitrary expression */
interface ViewWithListener extends View {
  /** a list of listeners */
  listeners?: {
    /** the key specifies what type of listener */
    [key: string]: ExpressionType;
  };
}

export type ViewListenerHandler = (
  context: {
    /** a means of evaluating an expression */
    expressionEvaluator: ExpressionEvaluator;
  },
  binding: BindingInstance,
) => void;

/** Sub out any _index_ refs with the ones from the supplied list */
function replaceExpressionIndexes(
  expression: ExpressionType,
  indexes: Array<string | number>,
): ExpressionType {
  if (indexes.length === 0) {
    return expression;
  }

  if (isExpressionNode(expression)) {
    return expression;
  }

  if (Array.isArray(expression)) {
    return expression.map((subExp) =>
      replaceExpressionIndexes(subExp, indexes),
    ) as any;
  }

  let workingExp = String(expression);

  for (
    let replacementIndex = 0;
    replacementIndex < indexes.length;
    replacementIndex += 1
  ) {
    const regex = new RegExp(
      `_index${replacementIndex === 0 ? "" : replacementIndex.toString()}_`,
      "g",
    );

    workingExp = workingExp.replace(
      regex,
      indexes[replacementIndex].toString(),
    );
  }

  return workingExp;
}

/**
 * Create a handler for view listeners with wildcard (._.) placeholders
 */
function createWildcardHandler(
  listenerBinding: string,
  listenerExp: ExpressionType,
  bindingParser: BindingParser,
): ViewListenerHandler {
  // The index of the start of the wildcard placeholder (foo._.bar)
  const wildCardIndex = listenerBinding.search(WILDCARD_REGEX);
  const parsedListenerBinding = bindingParser.parse(listenerBinding);

  // The top binding that we care about
  const topLevelBinding = bindingParser.parse(
    listenerBinding.substr(0, wildCardIndex),
  );

  /** Compute an updated expression (resolving _index_'s), or nothing if the binding update doesn't match */
  const getUpdatedExpressionToRun = (
    updatedBinding: BindingInstance,
  ): ExpressionType | undefined => {
    // what to replace _index_, _index1_, etc.
    const indexes: Array<number | string> = [];

    // walk down both bindings, and match up the ._. substitutions.
    // If we hit a placeholder, sub it out with the right value from the _actual_ binding
    // If we hit a non-placeholder, make sure the keys match up

    for (
      let bindingPartIndex = 0;
      bindingPartIndex < parsedListenerBinding.asArray().length;
      bindingPartIndex += 1
    ) {
      const listenerBindingPart =
        parsedListenerBinding.asArray()[bindingPartIndex];
      const updatedBindingPart = updatedBinding.asArray()[bindingPartIndex];

      if (listenerBindingPart === "_") {
        indexes.push(updatedBindingPart);
      } else if (updatedBindingPart !== listenerBindingPart) {
        // We are listening for a binding that isn't this one
        // foo._.bar vs. foo._.baz
        // bail out
        return;
      }
    }

    // sub out all of the _index_ values in the expression with our real ones.
    return replaceExpressionIndexes(listenerExp, indexes);
  };

  return (context, binding) => {
    if (topLevelBinding.contains(binding)) {
      // Check if the sub-listener is also a match
      const expToRun = getUpdatedExpressionToRun(binding);

      if (expToRun) {
        context.expressionEvaluator.evaluate(expToRun);
      }
    }
  };
}

/**
 * Extract data change listener from the view
 *
 * @param view - initial view with optional listener
 */
function extractDataChangeListeners(
  view: ViewWithListener,
  bindingParser: BindingParser,
): Array<ViewListenerHandler> {
  if (!view?.listeners) {
    return [];
  }

  const { listeners } = view;

  return Object.entries(listeners).reduce<Array<ViewListenerHandler>>(
    (allListeners, [listenerKey, listenerExp]) => {
      if (
        typeof listenerKey !== "string" ||
        !listenerKey.startsWith(LISTENER_TYPES.dataChange)
      ) {
        return allListeners;
      }

      const listenerRawBinding = listenerKey.slice(
        LISTENER_TYPES.dataChange.length,
      );

      if (listenerKey.match(WILDCARD_REGEX)) {
        return [
          ...allListeners,
          createWildcardHandler(listenerRawBinding, listenerExp, bindingParser),
        ];
      }

      const parsedOriginalBinding = bindingParser.parse(listenerRawBinding);

      return [
        ...allListeners,
        (context, binding) => {
          if (parsedOriginalBinding.contains(binding)) {
            context.expressionEvaluator.evaluate(listenerExp);
          }
        },
      ];
    },
    [],
  );
}

/**
 * this plugin processes the view level dataChange and evaluates custom expressions.
 */
export class DataChangeListenerPlugin implements PlayerPlugin {
  name = "data-change-listener-plugin";

  apply(player: Player) {
    let expressionEvaluator: ExpressionEvaluator;
    let dataChangeListeners: Array<ViewListenerHandler> = [];

    player.hooks.expressionEvaluator.tap(
      this.name,
      (expEvaluator: ExpressionEvaluator) => {
        expressionEvaluator = expEvaluator;
      },
    );

    /**
     * This function handles checking if the  updated field  requires an expression to be evaluated,
     * One of  the view-level listeners is attached to  the field
     *
     * @param updates - field updates
     */
    const onFieldUpdateHandler = (updates: Array<BindingInstance>) => {
      if (
        updates.length === 0 ||
        !expressionEvaluator ||
        dataChangeListeners.length === 0
      ) {
        return;
      }

      updates.forEach((binding) => {
        dataChangeListeners.forEach((handler) => {
          handler(
            {
              expressionEvaluator,
            },
            binding,
          );
        });
      });
    };

    player.hooks.dataController.tap(this.name, (dc: DataController) =>
      dc.hooks.onUpdate.tap(this.name, (updates, options) => {
        const { silent = false } = options || {};
        if (silent) return;
        const validUpdates = updates.filter((update) => {
          const committedVal = options?.context?.model.get(update.binding);
          return committedVal === update.newValue;
        });
        onFieldUpdateHandler(validUpdates.map((t) => t.binding));
      }),
    );

    /**
     * Adding an interceptor instead of tapping to make intention clear.  This plugin is not going to change the resolution of a view
     * so do not want to tap into the resolveView hook.  This will just intercept and extract required dependencies
     * There are other hooks that can be used:
     * 1) view -> onUpdate : the update object is the updated assets but this gets called upon  every data update
     * 2) view -> parser -> onParseObject: this gets called once per view but the input is a node  within the Content but since the listener is only supported at the view level, this would be excessive
     * 3) view -> resolve ->  : all resolve hooks are called every update - the listeners should not change between data updates.
     */
    const resolveViewInterceptor = {
      call: (view: View | undefined) => {
        const playerState = player.getState();

        if (playerState.status !== "in-progress" || !view) {
          return;
        }

        dataChangeListeners = extractDataChangeListeners(
          view,
          playerState.controllers.binding,
        );
      },
    };

    player.hooks.viewController.tap(
      this.name,
      (viewController: ViewController) => {
        viewController.hooks.resolveView.intercept(resolveViewInterceptor);

        // remove listeners after extracting so that it does not get triggered in subsequent view updates
        viewController.hooks.resolveView.tap(this.name, (view) => {
          const { listeners, ...withoutListeners } = view as any;
          return withoutListeners;
        });
      },
    );

    player.hooks.flowController.tap(this.name, (flowController) => {
      flowController.hooks.flow.tap(this.name, (flow) => {
        flow.hooks.transition.tap(this.name, (from, to) => {
          if (to.value.state_type !== "VIEW") {
            dataChangeListeners = [];
          }
        });
      });
    });
  }
}
