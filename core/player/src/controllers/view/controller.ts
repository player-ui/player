import { SyncHook, SyncWaterfallHook } from "tapable-ts";
import queueMicrotask from "queue-microtask";
import { Registry } from "@player-ui/partial-match-registry";
import type { View, NavigationFlowViewState } from "@player-ui/types";

import { resolveDataRefsInString } from "../../string-resolver";
import type { Resolve, ViewPlugin } from "../../view";
import {
  ApplicabilityPlugin,
  AssetPlugin,
  AssetTransformCorePlugin,
  MultiNodePlugin,
  StringResolverPlugin,
  SwitchPlugin,
  TemplatePlugin,
  toNodeResolveOptions,
  ViewInstance,
} from "../../view";
import type { Logger } from "../../logger";
import type { FlowInstance, FlowController } from "../flow";
import type { DataController } from "../data/controller";
import type { TransformRegistry } from "./types";
import type { BindingInstance } from "../../binding";

export interface ViewControllerOptions {
  /** Where to get data from */
  model: DataController;

  /** Where to log data */
  logger?: Logger;

  /** A flow-controller instance to listen for view changes */
  flowController: FlowController;
}

type ViewControllerHooks = {
  /** Do any processing before the `View` instance is created */
  resolveView: SyncWaterfallHook<
    [View | undefined, string, NavigationFlowViewState]
  >;

  /** The hook right before the View starts resolving. Attach anything custom here */
  view: SyncHook<[ViewInstance]>;
};

/** A controller to manage updating/switching views */
export class ViewController {
  public readonly hooks: ViewControllerHooks = {
    resolveView: new SyncWaterfallHook(),
    view: new SyncHook(),
  };

  private readonly viewMap: Record<string, View>;
  private readonly viewOptions: Resolve.ResolverOptions & ViewControllerOptions;
  private pendingUpdate?: {
    /** pending data binding changes */
    changedBindings?: Set<BindingInstance>;
    /** Whether we have a microtask queued to handle this pending update */
    scheduled?: boolean;
  };
  private readonly viewPlugins: Array<ViewPlugin>;

  public currentView?: ViewInstance;
  public transformRegistry: TransformRegistry = new Registry();
  public optimizeUpdates = true;

  constructor(
    initialViews: View[],
    options: Resolve.ResolverOptions & ViewControllerOptions,
  ) {
    this.viewOptions = options;
    this.viewMap = initialViews.reduce<Record<string, View>>(
      (viewMap, view) => {
        // eslint-disable-next-line no-param-reassign
        viewMap[view.id] = view;
        return viewMap;
      },
      {},
    );

    options.flowController.hooks.flow.tap(
      "viewController",
      (flow: FlowInstance) => {
        flow.hooks.transition.tap("viewController", (_oldState, newState) => {
          if (newState.value.state_type === "VIEW") {
            this.onView(newState.value);
          } else {
            this.currentView = undefined;
          }
        });
      },
    );

    /** Trigger a view update */
    const update = (updates: Set<BindingInstance>, silent = false) => {
      if (this.currentView) {
        if (this.optimizeUpdates) {
          this.queueUpdate(updates, silent);
        } else {
          this.currentView.update();
        }
      }
    };

    options.model.hooks.onUpdate.tap(
      "viewController",
      (updates, updateOptions) => {
        update(
          new Set(updates.map((t) => t.binding)),
          updateOptions?.silent ?? false,
        );
      },
    );

    options.model.hooks.onDelete.tap("viewController", (binding) => {
      const parentBinding = binding.parent();
      const property = binding.key();

      // Deleting an array item will trigger an update for the entire array
      if (typeof property === "number" && parentBinding) {
        update(new Set([parentBinding]));
      } else {
        update(new Set([binding]));
      }
    });

    this.viewPlugins = this.createViewPlugins();
  }

  private queueUpdate(bindings: Set<BindingInstance>, silent = false) {
    if (this.pendingUpdate?.changedBindings) {
      // If there's already a pending update, just add to it don't worry about silent updates here yet
      this.pendingUpdate.changedBindings = new Set([
        ...this.pendingUpdate.changedBindings,
        ...bindings,
      ]);
    } else {
      this.pendingUpdate = { changedBindings: bindings, scheduled: false };
    }

    // If there's no pending update, schedule one only if this one isn't silent
    // otherwise if this is silent, we'll just wait for the next non-silent update and make sure our bindings are included
    if (!this.pendingUpdate.scheduled && !silent) {
      this.pendingUpdate.scheduled = true;
      queueMicrotask(() => {
        const updates = this.pendingUpdate?.changedBindings;
        this.pendingUpdate = undefined;
        this.currentView?.update(updates);
      });
    }
  }

  private getViewForRef(viewRef: string): View | undefined {
    // First look for a 1:1 viewRef -> id mapping (this is most common)
    if (this.viewMap[viewRef]) {
      return this.viewMap[viewRef];
    }

    // The view ids saved may also contain model refs, resolve those and try again
    const matchingViewId = Object.keys(this.viewMap).find(
      (possibleViewIdMatch) =>
        viewRef ===
        resolveDataRefsInString(possibleViewIdMatch, {
          model: this.viewOptions.model,
          evaluate: this.viewOptions.evaluator.evaluate,
        }),
    );

    if (matchingViewId && this.viewMap[matchingViewId]) {
      return this.viewMap[matchingViewId];
    }
  }

  public onView(state: NavigationFlowViewState) {
    const viewId = state.ref;

    const source = this.hooks.resolveView.call(
      this.getViewForRef(viewId),
      viewId,
      state,
    );

    if (!source) {
      throw new Error(`No view with id ${viewId}`);
    }

    const view = new ViewInstance(source, this.viewOptions);
    this.currentView = view;

    // Give people a chance to attach their
    // own listeners to the view before we resolve it
    this.applyViewPlugins(view);
    this.hooks.view.call(view);
    view.update();
  }

  private applyViewPlugins(view: ViewInstance): void {
    for (const plugin of this.viewPlugins) {
      plugin.apply(view);
    }
  }

  private createViewPlugins(): Array<ViewPlugin> {
    const pluginOptions = toNodeResolveOptions(this.viewOptions);
    return [
      new AssetPlugin(),
      new SwitchPlugin(pluginOptions),
      new ApplicabilityPlugin(),
      new AssetTransformCorePlugin(this.transformRegistry),
      new StringResolverPlugin(),
      new TemplatePlugin(pluginOptions),
      new MultiNodePlugin(),
    ];
  }
}
