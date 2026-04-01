import type { Player, PlayerPlugin } from "@player-ui/player";
import { SyncHook, SyncBailHook } from "tapable-ts";
import type { BeaconPluginPlugin, BeaconArgs } from "@player-ui/beacon-plugin";
import { BeaconPlugin } from "@player-ui/beacon-plugin";
import {
  MetricsCorePluginSymbol,
  MetricsViewBeaconPluginContextSymbol,
} from "./symbols";

// Try to use performance.now() but fall back to Date.now() if you can't
export const defaultGetTime =
  typeof performance === "undefined"
    ? () => Date.now()
    : () => performance.now();

export type Timing = {
  /** Time this duration started (ms) */
  startTime: number;
} & (
  | {
      /** Flag set if this is currently in progress */
      completed: false;
    }
  | {
      /** The stopwatch has stopped */
      completed: true;

      /** The time in (ms) that the process ended */
      endTime: number;

      /** The elapsed time of this event (ms) */
      duration: number;
    }
);

export type NodeMetrics = Timing & {
  /** The type of the flow-state  */
  stateType: string;

  /** The name of the flow-state */
  stateName: string;
};

export type NodeRenderMetrics = NodeMetrics & {
  /** Timing representing the initial render */
  render: Timing;

  /** An array of timings representing updates to the view */
  updates: Array<Timing>;
};

export interface PlayerFlowMetrics {
  /** All metrics about a running flow */
  flow?: {
    /** The id of the flow these metrics are for */
    id: string;

    /** request time */
    requestTime?: number;

    /** A timeline of events for each node-state */
    timeline: Array<NodeMetrics | NodeRenderMetrics>;

    /** A timing measuring until the first interactive render */
    interactive: Timing;
  } & Timing;
}

const callbacks = [
  "onFlowBegin",
  "onFlowEnd",
  "onInteractive",
  "onNodeStart",
  "onNodeEnd",
  "onRenderStart",
  "onRenderEnd",
  "onUpdateStart",
  "onUpdateEnd",
  "onUpdate",
] as const;

/** Context structure for 'viewed' beacons rendering metrics */
export interface MetricsViewBeaconPluginContext {
  /** Represents the time taken before the view is first rendered */
  renderTime?: number;
  /** request time */
  requestTime?: number;
}

/** Simple [BeaconPluginPlugin] that adds renderTime to 'viewed' beacons data */
export class MetricsViewBeaconPlugin implements BeaconPluginPlugin {
  static Symbol = MetricsViewBeaconPluginContextSymbol;
  public readonly symbol = MetricsViewBeaconPlugin.Symbol;

  private metricsPlugin: MetricsCorePlugin;

  private resolvePendingRenderTime: ((renderTime: number) => void) | undefined;

  constructor(metricsPlugin: MetricsCorePlugin) {
    this.metricsPlugin = metricsPlugin;
    this.metricsPlugin.hooks.onRenderEnd.tap(
      "MetricsViewBeaconPlugin",
      (timing) => {
        if (timing.completed && this.resolvePendingRenderTime) {
          this.resolvePendingRenderTime(timing.duration);
          this.resolvePendingRenderTime = undefined;
        }
      },
    );
  }

  apply(beaconPlugin: BeaconPlugin) {
    beaconPlugin.hooks.buildBeacon.intercept({
      context: true,
      call: (context: any, beacon) => {
        if (context && (beacon as BeaconArgs).action === "viewed") {
          context[this.symbol] = this.buildContext();
        }
      },
    });
  }

  private async buildContext(): Promise<MetricsViewBeaconPluginContext> {
    return {
      renderTime: await this.getRenderTime(),
      requestTime: this.getRequestTime(),
    };
  }

  private async getRenderTime(): Promise<number> {
    const { flow } = this.metricsPlugin.getMetrics();

    if (flow) {
      const lastItem = flow.timeline[flow.timeline.length - 1];

      if ("render" in lastItem && lastItem.render.completed) {
        return lastItem.render.duration;
      }
    }

    return new Promise((resolve) => {
      this.resolvePendingRenderTime = resolve;
    });
  }

  private getRequestTime(): number | undefined {
    const { flow } = this.metricsPlugin.getMetrics();

    return flow?.requestTime;
  }
}

export interface MetricsWebPluginOptions {
  /** Called when a flow starts */
  onFlowBegin?: (update: PlayerFlowMetrics) => void;

  /** Called when a flow ends */
  onFlowEnd?: (update: PlayerFlowMetrics) => void;

  /** Called when a flow becomes interactive for the first time */
  onInteractive?: (timing: Timing, update: PlayerFlowMetrics) => void;

  /** Called when a new node is started */
  onNodeStart?: (
    nodeMetrics: NodeMetrics | NodeRenderMetrics,
    update: PlayerFlowMetrics,
  ) => void;

  /** Called when a node is ended */
  onNodeEnd?: (
    nodeMetrics: NodeMetrics | NodeRenderMetrics,
    update: PlayerFlowMetrics,
  ) => void;

  /** Called when rendering for a node begins */
  onRenderStart?: (
    timing: Timing,
    nodeMetrics: NodeRenderMetrics,
    update: PlayerFlowMetrics,
  ) => void;

  /** Called when rendering for a node ends */
  onRenderEnd?: (
    timing: Timing,
    nodeMetrics: NodeRenderMetrics,
    update: PlayerFlowMetrics,
  ) => void;

  /** Called when an update for a node begins */
  onUpdateStart?: (
    timing: Timing,
    nodeMetrics: NodeRenderMetrics,
    update: PlayerFlowMetrics,
  ) => void;

  /** Called when an update for a node ends */
  onUpdateEnd?: (
    timing: Timing,
    nodeMetrics: NodeRenderMetrics,
    update: PlayerFlowMetrics,
  ) => void;

  /** Callback to subscribe to updates for any metric */
  onUpdate?: (metrics: PlayerFlowMetrics) => void;

  /**
   * A flag to set if you want to track render times for nodes
   * This requires that the UI calls `renderEnd()` when the view is painted.
   */
  trackRenderTime?: boolean;

  /**
   * A flag to set if you want to track update times for nodes
   * This requires that the UI calls `renderEnd()` when the view is painted.
   */
  trackUpdateTime?: boolean;

  /** A function to get the current time (in ms) */
  getTime?: () => number;
}

/**
 * A plugin that enables request time metrics
 */
export class RequestTimeWebPlugin {
  getRequestTime: () => number | undefined;
  name = "RequestTimeWebPlugin";

  constructor(getRequestTime: () => number | undefined) {
    this.getRequestTime = getRequestTime;
  }

  apply(metricsCorePlugin: MetricsCorePlugin) {
    metricsCorePlugin.hooks.resolveRequestTime.tap(this.name, () => {
      return this.getRequestTime();
    });
  }
}

/**
 * A plugin that enables gathering of render metrics
 */
export class MetricsCorePlugin implements PlayerPlugin {
  name = "metrics";

  static Symbol = MetricsCorePluginSymbol;
  public readonly symbol = MetricsCorePluginSymbol;

  protected trackRender: boolean;
  protected trackUpdate: boolean;
  protected getTime: () => number;

  public readonly hooks = {
    resolveRequestTime: new SyncBailHook<[], number>(),

    onFlowBegin: new SyncHook<[PlayerFlowMetrics]>(),
    onFlowEnd: new SyncHook<[PlayerFlowMetrics]>(),

    onInteractive: new SyncHook<[Timing, PlayerFlowMetrics]>(),

    onNodeStart: new SyncHook<[NodeMetrics | NodeRenderMetrics]>(),
    onNodeEnd: new SyncHook<[NodeMetrics | NodeRenderMetrics]>(),

    onRenderStart: new SyncHook<
      [Timing, NodeRenderMetrics, PlayerFlowMetrics]
    >(),
    onRenderEnd: new SyncHook<[Timing, NodeRenderMetrics, PlayerFlowMetrics]>(),

    onUpdateStart: new SyncHook<
      [Timing, NodeRenderMetrics, PlayerFlowMetrics]
    >(),
    onUpdateEnd: new SyncHook<[Timing, NodeRenderMetrics, PlayerFlowMetrics]>(),

    onUpdate: new SyncHook<[PlayerFlowMetrics]>(),
  };

  private metrics: PlayerFlowMetrics = {};

  constructor(options?: MetricsWebPluginOptions) {
    this.trackRender = options?.trackRenderTime ?? false;
    this.trackUpdate = options?.trackUpdateTime ?? false;
    this.getTime = options?.getTime ?? defaultGetTime;

    /** fn to call the update hook */
    const callOnUpdate = () => {
      this.hooks.onUpdate.call(this.metrics);
    };

    this.hooks.onFlowBegin.tap(this.name, callOnUpdate);
    this.hooks.onFlowEnd.tap(this.name, callOnUpdate);
    this.hooks.onInteractive.tap(this.name, callOnUpdate);
    this.hooks.onNodeStart.tap(this.name, callOnUpdate);
    this.hooks.onNodeEnd.tap(this.name, callOnUpdate);

    this.hooks.onRenderStart.tap(this.name, callOnUpdate);
    this.hooks.onRenderEnd.tap(this.name, callOnUpdate);

    this.hooks.onUpdateStart.tap(this.name, callOnUpdate);
    this.hooks.onUpdateEnd.tap(this.name, callOnUpdate);

    callbacks.forEach((hookName) => {
      if (options?.[hookName] !== undefined) {
        (this.hooks[hookName] as any).tap("options", options?.[hookName]);
      }
    });
  }

  /**
   * Fetch the metrics of the current flow
   */
  public getMetrics(): PlayerFlowMetrics {
    return this.metrics;
  }

  /** Called when the UI layer wishes to start a timer for rendering */
  private renderStart(): void {
    // Grab the last update
    const timeline = this.metrics.flow?.timeline;

    if (!timeline || timeline.length === 0) {
      return;
    }

    const lastItem = timeline[timeline.length - 1];

    if ("updates" in lastItem) {
      // Get the last update, make sure it's completed
      if (lastItem.updates.length > 0) {
        const lastUpdate = lastItem.updates[lastItem.updates.length - 1];

        if (lastUpdate.completed === false) {
          // Starting a new render before the last one was finished.
          // Just ignore it and include as part of 1 render time
          return;
        }
      }

      if (!lastItem.render.completed) {
        // Starting a new render before the last one was finished.
        // Just ignore it and include as part of 1 render time
        return;
      }

      const update: Timing = {
        completed: false,
        startTime: defaultGetTime(),
      };

      lastItem.updates.push(update);

      this.hooks.onUpdateStart.call(update, lastItem, this.metrics);
    } else {
      const renderInfo = {
        ...lastItem,
        render: {
          completed: false,
          startTime: defaultGetTime(),
        },
        updates: [],
      } as NodeRenderMetrics;

      timeline[timeline.length - 1] = renderInfo;

      this.hooks.onRenderStart.call(
        renderInfo.render,
        renderInfo,
        this.metrics,
      );
    }
  }

  /** Called when the UI layer wants to end the rendering timer */
  public renderEnd(): void {
    if (!this.trackRender) {
      throw new Error(
        "Must start the metrics-plugin with render tracking enabled",
      );
    }

    const { flow } = this.metrics;

    if (!flow) {
      return;
    }

    const { timeline, interactive } = flow;

    if (!timeline || !interactive || timeline.length === 0) {
      return;
    }

    const lastItem = timeline[timeline.length - 1];

    if (!("render" in lastItem)) {
      return;
    }

    // Check if this is an update or render
    const endTime = defaultGetTime();

    if (lastItem.render.completed) {
      // This is the end of an existing update

      if (lastItem.updates.length === 0) {
        // throw new Error("Trying to end an update that's not in progress");
        return;
      }

      const lastUpdate = lastItem.updates[lastItem.updates.length - 1];

      if (lastUpdate.completed === true) {
        // throw new Error("Trying to end an update that's not in progress");
        return;
      }

      const update = {
        ...lastUpdate,
        completed: true,
        endTime,
        duration: endTime - lastUpdate.startTime,
      };

      lastItem.updates[lastItem.updates.length - 1] = update;
      this.hooks.onUpdateEnd.call(update, lastItem, this.metrics);
    } else {
      lastItem.render = {
        ...lastItem.render,
        completed: true,
        endTime,
        duration: endTime - lastItem.startTime,
      };
      this.hooks.onRenderEnd.call(lastItem.render, lastItem, this.metrics);

      if (!interactive.completed) {
        flow.interactive = {
          ...interactive,
          completed: true,
          duration: endTime - interactive.startTime,
          endTime,
        };

        this.hooks.onInteractive.call(flow.interactive, this.metrics);
      }
    }
  }

  apply(player: Player): void {
    player.hooks.onStart.tap(this.name, (flow) => {
      const requestTime = this.hooks.resolveRequestTime.call();
      const startTime = defaultGetTime();
      this.metrics = {
        flow: {
          id: flow.id,
          requestTime: requestTime ?? undefined,
          timeline: [],
          startTime,
          completed: false,
          interactive: {
            completed: false,
            startTime,
          },
        },
      };

      this.hooks.onFlowBegin.call(this.metrics);
    });

    player.hooks.state.tap(this.name, (state) => {
      if (state.status === "completed" || state.status === "error") {
        const endTime = defaultGetTime();
        const { flow } = this.metrics;

        if (flow === undefined || flow?.completed === true) {
          return;
        }

        this.metrics = {
          flow: {
            ...flow,
            completed: true,
            endTime,
            duration: endTime - flow.startTime,
          },
        };

        // get the last update

        const lastUpdate = flow.timeline[flow.timeline.length - 1];

        if (lastUpdate && !lastUpdate.completed) {
          (this.metrics.flow as any).timeline[flow.timeline.length - 1] = {
            ...lastUpdate,
            completed: true,
            endTime,
            duration: endTime - lastUpdate.startTime,
          };
        }

        this.hooks.onFlowEnd.call(this.metrics);
      }
    });

    player.hooks.flowController.tap(this.name, (fc) => {
      fc.hooks.flow.tap(this.name, (f) => {
        f.hooks.transition.tap(this.name, (from, to) => {
          const time = defaultGetTime();
          const { flow } = this.metrics;

          if (!flow) {
            return;
          }

          const { timeline } = flow;

          // End the last state, and start the next one

          if (timeline.length > 0) {
            const prev = timeline[timeline.length - 1];

            if (prev.completed) {
              throw new Error("Completing a state that's already done.");
            }

            timeline[timeline.length - 1] = {
              ...prev,
              completed: true,
              endTime: time,
              duration: time - prev.startTime,
            };

            this.hooks.onNodeEnd.call(timeline[timeline.length - 1]);
          }

          const nodeMetrics = {
            completed: false,
            startTime: time,
            stateName: to.name,
            stateType: to.value.state_type,
          } as const;

          timeline.push(nodeMetrics);
          this.hooks.onNodeStart.call(nodeMetrics);
        });
      });
    });

    if (this.trackRender) {
      player.hooks.view.tap(this.name, (v) => {
        if (this.trackUpdate) {
          v.hooks.onUpdate.tap(this.name, () => {
            this.renderStart();
          });
        } else {
          this.renderStart();
        }
      });

      player.applyTo<BeaconPlugin>(BeaconPlugin.Symbol, (beaconPlugin) =>
        new MetricsViewBeaconPlugin(this).apply(beaconPlugin),
      );
    }
  }
}
