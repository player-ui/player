import { waitFor } from '@testing-library/react';
import type { BeaconPluginPlugin } from '@player-ui/beacon-plugin';
import { BeaconPlugin } from '@player-ui/beacon-plugin';
import type { InProgressState } from '@player-ui/player';
import { Player } from '@player-ui/player';
import type { Flow } from '@player-ui/types';
import type { NodeRenderMetrics } from '.';
import {
  MetricsCorePlugin,
  MetricsViewBeaconPlugin,
  RequestTimeWebPlugin,
} from '.';

const basicContentWithActions: Flow<any> = {
  id: 'test-flow',
  views: [
    {
      id: 'my-view',
      actions: [
        {
          asset: {
            id: 'next-label-action',
            type: 'action',
            value: '{{foo.bar}}',
          },
        },
      ],
    },
  ],
  navigation: {
    BEGIN: 'FLOW_1',
    FLOW_1: {
      startState: 'VIEW_1',
      VIEW_1: {
        state_type: 'VIEW',
        ref: 'my-view',
        transitions: {
          '*': 'OTHER_2',
        },
      },
      OTHER_2: {
        state_type: 'VIEW',
        ref: 'my-view',
        transitions: {
          '*': 'END_Done',
        },
      },
      END_Done: {
        state_type: 'END',
        outcome: 'done',
      },
    },
  },
};

test('tracks metrics', () => {
  const onUpdate = jest.fn();
  const metrics = new MetricsCorePlugin({ onUpdate });
  const player = new Player({ plugins: [metrics] });
  player.start(basicContentWithActions);

  let flowMetrics = metrics.getMetrics();

  /**
   *
   */
  const transition = () => {
    (player.getState() as InProgressState).controllers.flow.transition('Next');
    flowMetrics = metrics.getMetrics();
  };

  expect(onUpdate).toBeCalledTimes(2);
  expect(flowMetrics.flow?.completed).toBe(false);
  expect(flowMetrics.flow?.id).toBe('test-flow');
  expect(flowMetrics.flow?.timeline[0]).toMatchObject({
    stateName: 'VIEW_1',
    stateType: 'VIEW',
  });

  transition();
  expect(onUpdate).toBeCalledTimes(4);
  expect(flowMetrics.flow?.timeline[0].completed).toBe(true);
  expect(flowMetrics.flow?.timeline).toHaveLength(2);
  transition();
  expect(onUpdate).toBeCalledTimes(6);
});

test('tracks metrics w/ render time', () => {
  const onRenderEnd = jest.fn();
  const metrics = new MetricsCorePlugin({
    trackRenderTime: true,
    trackUpdateTime: true,
    onRenderEnd,
  });
  const player = new Player({ plugins: [metrics] });
  player.start(basicContentWithActions);
  metrics.renderEnd();
  expect(onRenderEnd).toBeCalledTimes(1);
  const flowMetrics = metrics.getMetrics();

  /**
   *
   */
  const transition = () => {
    (player.getState() as InProgressState).controllers.flow.transition('Next');

    const state = player.getState();

    if (state.status === 'in-progress') {
      if (
        state.controllers.flow.current?.currentState?.value.state_type ===
        'VIEW'
      ) {
        metrics.renderEnd();
      }
    }
  };

  expect(flowMetrics.flow?.completed).toBe(false);
  expect(flowMetrics.flow?.id).toBe('test-flow');
  expect(flowMetrics.flow?.timeline[0]).toMatchObject({
    stateName: 'VIEW_1',
    stateType: 'VIEW',
  });

  transition();
  expect(flowMetrics.flow?.timeline[0].completed).toBe(true);
  expect(flowMetrics.flow?.timeline).toHaveLength(2);
  transition();

  expect(
    (flowMetrics.flow?.timeline[0] as NodeRenderMetrics).render.completed
  ).toBe(true);
});

test('handles double updates', async () => {
  const onRenderEnd = jest.fn();
  const metrics = new MetricsCorePlugin({
    trackRenderTime: true,
    trackUpdateTime: true,
    onRenderEnd,
  });
  const player = new Player({ plugins: [metrics] });
  player.start(basicContentWithActions);
  metrics.renderEnd();
  expect(onRenderEnd).toBeCalledTimes(1);
  /**
   *
   */
  const getDataController = () =>
    (player.getState() as InProgressState).controllers.data;
  getDataController().set([['foo.bar', 'update-1']]);
  metrics.renderEnd(); // Adds 1 update

  await waitFor(() =>
    expect(
      (metrics.getMetrics().flow?.timeline[0] as NodeRenderMetrics).updates
    ).toHaveLength(1)
  );

  // Don't send a render-end for the second
  getDataController().set([['foo.bar', 'update-2']]);
  getDataController().set([['foo.bar', 'update-3']]);
  metrics.renderEnd(); // Adds another update

  await waitFor(() =>
    expect(
      (metrics.getMetrics().flow?.timeline[0] as NodeRenderMetrics).updates
    ).toHaveLength(2)
  );
});

class MyBeaconPluginPlugin implements BeaconPluginPlugin {
  apply(beaconPlugin: BeaconPlugin) {
    beaconPlugin.hooks.buildBeacon.tap(
      { name: 'my-beacon-plugin', context: true },
      async (context, beacon: any) => {
        const { renderTime } =
          (await (context as any)[MetricsViewBeaconPlugin.Symbol]) || {};

        // move renderTime from data to top-level
        return {
          ...beacon,
          ...(renderTime && { renderTime }),
        };
      }
    );
  }
}

test('viewed beacon builder can use request time', async () => {
  const getRequestTime = jest.fn().mockImplementation(() => 123);
  const metricsPlugin = new MetricsCorePlugin({
    trackRenderTime: true,
    trackUpdateTime: true,
  });
  new RequestTimeWebPlugin(getRequestTime).apply(metricsPlugin);
  const beaconPlugin = new BeaconPlugin({
    plugins: [new MyBeaconPluginPlugin()],
  });

  const player = new Player({
    plugins: [beaconPlugin, metricsPlugin],
  });
  player.start(basicContentWithActions as any);
  expect(getRequestTime).toBeCalledTimes(1);
  expect(metricsPlugin.getMetrics()?.flow?.requestTime).toBe(123);
});

test('viewed beacon builder can use render time', async () => {
  const handler = jest.fn();

  const metricsPlugin = new MetricsCorePlugin({
    trackRenderTime: true,
    trackUpdateTime: true,
  });
  const beaconPlugin = new BeaconPlugin({
    callback: handler,
    plugins: [new MyBeaconPluginPlugin()],
  });

  const player = new Player({
    plugins: [beaconPlugin, metricsPlugin],
  });
  player.start(basicContentWithActions as any);

  const onRenderEndPromise = new Promise((resolve) => {
    metricsPlugin.hooks.onRenderEnd.tap(
      'on-render-end',
      (timing) => timing.completed && resolve(timing.duration)
    );
  });
  metricsPlugin.renderEnd();
  const duration = await onRenderEndPromise;

  await waitFor(() => expect(handler.mock.calls[0][0].assetId).toBe('my-view'));
  expect(handler.mock.calls[0][0].renderTime).toBe(duration);
});

test('viewed beacon builder can use render time when it resolves', async () => {
  const handler = jest.fn();

  const metricsPlugin = new MetricsCorePlugin({
    trackRenderTime: true,
    trackUpdateTime: true,
  });
  const beaconPlugin = new BeaconPlugin({
    callback: handler,
    plugins: [new MyBeaconPluginPlugin()],
  });

  const player = new Player({
    plugins: [beaconPlugin, metricsPlugin],
  });
  player.start(basicContentWithActions as any);

  const onRenderEndPromise = new Promise((resolve) => {
    metricsPlugin.hooks.onRenderEnd.tap(
      'on-render-end',
      (timing) => timing.completed && resolve(timing.duration)
    );
  });
  metricsPlugin.renderEnd();
  const duration = await onRenderEndPromise;

  await waitFor(() => expect(handler.mock.calls[0][0].assetId).toBe('my-view'));
  expect(handler.mock.calls[0][0].renderTime).toBe(duration);
});
