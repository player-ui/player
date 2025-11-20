import type { ReactPlayer, Player, ReactPlayerPlugin } from "@player-ui/react";
import type { Timing } from "@player-ui/metrics-plugin-react";
import { MetricsPlugin } from "@player-ui/metrics-plugin-react";
import type { Dispatch } from "redux";
import type {
  DataChangeEventType,
  LogEventType,
  StateChangeEventType,
  MetricChangeEventType,
} from "../state";
import { createEvent } from "../state";
import { addEvents, clearEvents } from "../redux";

/**
 *
 * A web plugin for interacting with storybook
 */
export class StorybookPlayerPlugin implements ReactPlayerPlugin {
  public readonly name = "Storybook";

  private dispatch: Dispatch;
  private metricsPlugin: MetricsPlugin;

  constructor(dispatch: Dispatch) {
    this.dispatch = dispatch;
    this.metricsPlugin = new MetricsPlugin({
      onUpdate: (metrics) => {
        // TODO: Add this in
        // actions.setMetrics(metrics);
      },
      onRenderEnd: (timing) => {
        this.onMetricChange(timing, "render");
      },
      onUpdateEnd: (timing) => {
        this.onMetricChange(timing, "update");
      },
    });
  }

  apply(player: Player) {
    player.registerPlugin(this.metricsPlugin);
  }

  applyReact(rp: ReactPlayer) {
    rp.registerPlugin(this.metricsPlugin);

    rp.player.hooks.dataController.tap(this.name, (dc) => {
      this.dispatch(clearEvents());

      dc.hooks.onUpdate.tap(this.name, (dataUpdates) => {
        const events: Array<DataChangeEventType> = dataUpdates.map(
          (dataUpdate) =>
            createEvent({
              type: "dataChange",
              binding: dataUpdate.binding.asString(),
              from: dataUpdate.oldValue,
              to: dataUpdate.newValue,
            }),
        );
        this.dispatch(addEvents(events));
      });
    });

    rp.player.logger.hooks.log.tap(this.name, (severity, data) => {
      this.dispatch(
        addEvents([
          createEvent<LogEventType>({
            type: "log",
            message: data,
            severity,
          }),
        ]),
      );
    });

    rp.player.hooks.state.tap(this.name, (newState) => {
      if ("error" in newState) {
        this.dispatch(
          addEvents([
            createEvent<StateChangeEventType>({
              type: "stateChange",
              state: newState.status,
              error: newState.error.message,
            }),
          ]),
        );
      } else if (newState.status === "completed") {
        this.dispatch(
          addEvents([
            createEvent<StateChangeEventType>({
              type: "stateChange",
              state: newState.status,
              outcome: newState.endState.outcome,
            }),
          ]),
        );
      } else {
        this.dispatch(
          addEvents([
            createEvent<StateChangeEventType>({
              type: "stateChange",
              state: newState.status,
            }),
          ]),
        );
      }
    });
  }

  onMetricChange(timing: Timing, metricType: string) {
    if (!timing.completed) {
      return;
    }

    this.dispatch(
      addEvents([
        createEvent<MetricChangeEventType>({
          type: "metric",
          metricType,
          message: `Duration: ${timing.duration.toFixed(0)} ms`,
        }),
      ]),
    );
  }
}
