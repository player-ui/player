import React from 'react';
import {
  render,
  screen,
  getNodeText,
  act,
  configure,
} from '@testing-library/react';
import type { InProgressState } from '@player-ui/player';
import { makeFlow } from '@player-ui/make-flow';
import { WebPlayer } from '..';
import { simpleFlow, SimpleAssetPlugin } from './helpers/simple-asset-plugin';

configure({
  testIdAttribute: 'id',
});

describe('WebPlayer React', () => {
  test('renders into a react comp', async () => {
    const wp = new WebPlayer({ plugins: [new SimpleAssetPlugin()] });

    wp.start(simpleFlow);
    const ele = render(
      <React.Suspense fallback="fallback">
        <wp.Component />
      </React.Suspense>
    );

    const viewNode = await ele.findByTestId('first_view');

    expect(ele).toMatchSnapshot();
    expect(getNodeText(viewNode!)).toBe('');
  });

  test('uses existing data', async () => {
    const wp = new WebPlayer({ plugins: [new SimpleAssetPlugin()] });
    wp.start({ ...simpleFlow, data: { foo: { bar: 'Initial Value' } } });
    const ele = render(
      <React.Suspense fallback="fallback">
        <wp.Component />
      </React.Suspense>
    );

    const viewNode = await ele.findByTestId('first_view');
    expect(getNodeText(viewNode!)).toBe('Initial Value');
  });

  test('fails flow when UI throws error', async () => {
    const wp = new WebPlayer({ suspend: false });
    const response = wp.start(makeFlow({ type: 'err', id: 'Error' }));
    act(() => {
      render(<wp.Component />);
    });
    await expect(response).rejects.toThrow();
  });

  test('updates the react comp when view updates', async () => {
    const wp = new WebPlayer({
      plugins: [new SimpleAssetPlugin()],
      suspend: false,
    });
    wp.start(simpleFlow);
    const ele = render(<wp.Component />);

    const viewNode = await ele.findByTestId('first_view');
    expect(getNodeText(viewNode!)).toBe('');
    act(() => {
      const state = wp.player.getState();

      if (state.status === 'in-progress') {
        state.controllers.data.set([['foo.bar', 'some update']]);
      }
    });

    await ele.findByText('some update');
    expect(getNodeText(viewNode!)).toBe('some update');
  });

  test('shares a core player with multiple web-players', async () => {
    const wp = new WebPlayer({ plugins: [new SimpleAssetPlugin()] });

    wp.start(simpleFlow);

    const wpEle = render(
      <React.Suspense fallback="fallback">
        <wp.Component />
      </React.Suspense>
    );

    const viewNode = await wpEle.findByTestId('first_view');
    expect(getNodeText(viewNode!)).toBe('');

    const wp2 = new WebPlayer({
      plugins: [new SimpleAssetPlugin()],
      player: wp.player,
    });

    const wp2Ele = render(
      <React.Suspense fallback="fallback">
        <wp2.Component />
      </React.Suspense>
    );
    const wp2ViewNode = await wp2Ele.findByTestId('first_view');
    expect(getNodeText(wp2ViewNode!)).toBe('');

    act(() => {
      const state = wp.player.getState();

      if (state.status === 'in-progress') {
        state.controllers.data.set([['foo.bar', 'new text']]);
      }
    });

    await wpEle.findAllByText('new text');
    expect(getNodeText(viewNode!)).toBe('new text');
    expect(getNodeText(wp2ViewNode!)).toBe('new text');
  });
});

/**
 *
 */
const Fallback = () => <div id="loader">Loading...</div>;

describe('Suspense', () => {
  test('suspends while waiting for a flow to start', async () => {
    const wp = new WebPlayer({
      suspend: true,
      plugins: [new SimpleAssetPlugin()],
    });

    render(
      <React.Suspense fallback={<Fallback />}>
        <wp.Component />
      </React.Suspense>
    );

    const viewText = 'View!';

    const loader = await screen.findByText('Loading...');
    expect(loader).toBeInTheDocument();

    await act(async () => {
      wp.start({
        ...simpleFlow,
        data: { foo: { bar: viewText } },
      });
    });
    const view = await screen.findByText(viewText);
    expect(view).toBeInTheDocument();
  });

  test('suspends while waiting for the view to render', async () => {
    const wp = new WebPlayer({
      suspend: true,
      plugins: [new SimpleAssetPlugin()],
    });

    const viewText = 'View!';

    wp.start({
      ...simpleFlow,
      data: { foo: { bar: viewText } },
      navigation: {
        BEGIN: 'flow_1',
        flow_1: {
          startState: 'ext_1',
          ext_1: {
            state_type: 'EXTERNAL',
            ref: 'waiting',
            transitions: {
              '*': 'view_1',
            },
          },
          view_1: {
            state_type: 'VIEW',
            ref: 'first_view',
            transitions: {},
          },
        },
      },
    });

    render(
      <React.Suspense fallback={<Fallback />}>
        <wp.Component />
      </React.Suspense>
    );

    const loader = await screen.findByText('Loading...');
    expect(loader).toBeInTheDocument();

    act(() => {
      const playerState = wp.player.getState() as InProgressState;
      playerState.controllers.flow.transition('Next');
    });

    const view = await screen.findByText(viewText);
    expect(view).toBeInTheDocument();
  });

  test('suspends at the end of a flow until the next one starts', async () => {
    const wp = new WebPlayer({
      suspend: true,
      plugins: [new SimpleAssetPlugin()],
    });

    const view1Text = 'View!';
    wp.start({
      ...simpleFlow,
      data: { foo: { bar: view1Text } },
    });

    render(
      <React.Suspense fallback={<Fallback />}>
        <wp.Component />
      </React.Suspense>
    );

    const view1 = await screen.findByText(view1Text);
    expect(view1).toBeInTheDocument();

    await act(async () => {
      const playerState = wp.player.getState() as InProgressState;
      playerState.controllers.flow.transition('Next');
    });

    const loader = await screen.findByText('Loading...');
    expect(loader).toBeInTheDocument();

    const view2Text = 'Second View!';

    await act(async () => {
      wp.start({
        ...simpleFlow,
        data: { foo: { bar: view2Text } },
      });
    });

    const view2 = await screen.findByText(view2Text);
    expect(view2).toBeInTheDocument();
  });
});
