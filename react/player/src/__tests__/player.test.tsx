import { useSubscribedState } from "@player-ui/react-subscribe";
import { act, render, screen } from "@testing-library/react";
import React, { Suspense, type ComponentType } from "react";
import { describe, expect, test } from "vitest";
import { ReactPlayer, type ReactPlayerPlugin } from "../player";

describe("ReactPlayer", () => {
  test("switching from suspending component to an alternative component does not hang", async () => {
    let rp: ReactPlayer;

    const viewUpdateEvent = { type: "alternative-component", id: "1" };

    const TestPlugin: ReactPlayerPlugin = {
      name: "test-plugin",
      applyReact: (reactPlayer) => {
        rp = reactPlayer;

        // Register a dummy asset for the alternative component
        // This prevents ActualPlayerComp from crashing if it renders before being unmounted
        const dummyAsset = { type: viewUpdateEvent.type };
        const dummyComponent = () => <div>Dummy Asset</div>;
        reactPlayer.assetRegistry.set(dummyAsset, dummyComponent);

        reactPlayer.hooks.webComponent.tap(
          "test",
          (Comp: ComponentType) =>
            function WebComponent() {
              const view = useSubscribedState(
                reactPlayer.viewUpdateSubscription,
              );

              if (view?.type === viewUpdateEvent.type) {
                return <div>Alternative</div>;
              }

              return <Comp />;
            },
        );
      },
    };

    const plugins = [TestPlugin];
    const options = { plugins };
    const { Component: ReactPlayerComponent } = new ReactPlayer(options);

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <ReactPlayerComponent />
      </Suspense>,
    );

    // Initially, the player suspends because no view is loaded
    expect(screen.getByText("Loading...")).toBeDefined();

    // Switch to alternative component which removes the suspending component from the tree
    await act(() => rp.viewUpdateSubscription.publish(viewUpdateEvent));

    // React should display the Alternative component and not hang here or fail to update
    expect(await screen.findByText("Alternative")).toBeDefined();
  });
});
