import React from 'react';
import { ReactPlayer, ReactPlayerPlugin } from '@player-ui/react';
import { DevtoolsPlugin } from '@player-ui/devtools-plugin';
import { Events, Methods, RUNTIME_SOURCE } from '@player-tools/devtools-common';

export function publishWebEvent(event: Events.Event) {
  try {
    window.postMessage(event, '*');
  } catch (e) {
    console.error(event);
    throw e;
  }
}

export class DevtoolsWebPlugin implements ReactPlayerPlugin {
  name = 'devtools-web';

  private coreDevtoolsPlugin: DevtoolsPlugin;
  public readonly playerID: string;

  constructor(playerID: string) {
    this.playerID = playerID;
    this.coreDevtoolsPlugin = new DevtoolsPlugin(playerID, publishWebEvent);

    window.addEventListener('message', (event: MessageEvent<any>) => {
      const { data } = event;
      if (Methods.isMethod(data) && !data.result) {
        const result = this.coreDevtoolsPlugin.callbacks[data.type](data.params)
        event.source?.postMessage({
          ...data,
          result,
        })
      }
    });
  }

  /** Legacy applier */
  applyWeb(reactPlayer: ReactPlayer) { this.applyReact(reactPlayer) }

  applyReact(reactPlayer: ReactPlayer) {
    const { playerID, coreDevtoolsPlugin } = this;
    const { player } = reactPlayer;

    player.registerPlugin(coreDevtoolsPlugin);
    // TODO: Configure _web_ specific callbacks here -- like maybe render time

    /**
     * Component wrapped around Web Player Component.
     * note: converting this to a functional component
     *  will cause "invalid hook call" warning
     */
    class WrappedComp extends React.Component {
      componentDidMount() {
        publishWebEvent({
          type: 'player-init',
          playerID,
          version: player.getVersion?.(),
          source: RUNTIME_SOURCE,
        });
      }

      componentWillUnmount() {
        publishWebEvent({
          type: 'player-removed',
          playerID,
          source: RUNTIME_SOURCE,
        })
      }

      render() {
        return this.props.children;
      }
    }

    reactPlayer.hooks.webComponent.tap(this.name, (Comp) => () => {
      return (
        <WrappedComp>
          <Comp />
        </WrappedComp>
      );
    });
  }
}
