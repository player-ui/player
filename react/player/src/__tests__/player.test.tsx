import { useSubscribedState } from "@player-ui/react-subscribe";
import { act, render, screen } from "@testing-library/react";
import React, { Suspense, type ComponentType } from "react";
import { describe, expect, it } from "vitest";
import { ReactPlayer, type ReactPlayerPlugin } from "../player";

describe("ReactPlayer", () => {
  const genericViewEvent = { type: "generic", id: "view-1" };
  const altViewEvent = { type: "alternative-component", id: "view-2" };

  it("should switch from suspending component to an alternative component without hanging", async () => {
    let rp: ReactPlayer;

    const TestPlugin: ReactPlayerPlugin = {
      name: "test-plugin",
      applyReact: (reactPlayer) => {
        rp = reactPlayer;
        registerAssets(reactPlayer);
        registerWebComponent(reactPlayer);
      },
    };

    renderWithPlugin([TestPlugin]);

    // Initially, the player suspends because no view is loaded
    expect(screen.getByText("Loading...")).toBeDefined();

    // Switch to alternative component which removes the suspending component from the tree
    await act(() => rp.viewUpdateSubscription.publish(altViewEvent));

    // React should display the Alternative component and not hang here or fail to update
    expect(await screen.findByText("Alternative")).toBeDefined();
  });

  it("should transition from fallback -> base component (generic asset) -> alternative component", async () => {
    let rp: ReactPlayer;

    const TestPlugin: ReactPlayerPlugin = {
      name: "test-plugin",
      applyReact: (reactPlayer) => {
        rp = reactPlayer;
        registerAssets(reactPlayer);
        registerWebComponent(reactPlayer);
      },
    };

    renderWithPlugin([TestPlugin]);

    // 1. Start with a fallback
    expect(screen.getByText("Loading...")).toBeDefined();

    // 2. Render the generic Base Component and verify the Generic Asset is shown
    await act(() => rp.viewUpdateSubscription.publish(genericViewEvent));
    expect(await screen.findByText("Generic Asset")).toBeDefined();

    // 3. Render and verify the Alternative Component is shown
    await act(() => rp.viewUpdateSubscription.publish(altViewEvent));
    expect(await screen.findByText("Alternative")).toBeDefined();
  });

  function registerAssets(reactPlayer: ReactPlayer): void {
    reactPlayer.assetRegistry.set({ type: genericViewEvent.type }, () => (
      <div>Generic Asset</div>
    ));
    reactPlayer.assetRegistry.set({ type: altViewEvent.type }, () => (
      <div>Alternative Asset</div>
    ));
  }

  function registerWebComponent(reactPlayer: ReactPlayer): void {
    const { hooks, viewUpdateSubscription } = reactPlayer;

    hooks.webComponent.tap(
      "test",
      (BaseComponent: ComponentType) =>
        function WebComponent() {
          const view = useSubscribedState(viewUpdateSubscription);

          if (view?.type === altViewEvent.type) {
            return <div>Alternative</div>;
          }

          return <BaseComponent />;
        },
    );
  }

  function renderWithPlugin(plugins: Array<ReactPlayerPlugin>) {
    const { Component: ReactPlayerComponent } = new ReactPlayer({ plugins });

    return render(
      <Suspense fallback={<div>Loading...</div>}>
        <ReactPlayerComponent />
      </Suspense>,
    );
  }

  describe("registerPlugin", () => {
    it("should call apply on the underlying core player for a plugin with only apply", () => {
      let applyCalled = false;
      const corePlugin: ReactPlayerPlugin = {
        name: "core-only-plugin",
        apply: () => {
          applyCalled = true;
        },
      };

      const rp = new ReactPlayer({ plugins: [] });
      rp.registerPlugin(corePlugin);

      expect(applyCalled).toBe(true);
      expect(rp.options.plugins).toContain(corePlugin);
    });

    it("should call both apply and applyReact for a plugin with both", () => {
      let applyCalled = false;
      let applyReactCalled = false;
      const dualPlugin: ReactPlayerPlugin = {
        name: "dual-plugin",
        apply: () => {
          applyCalled = true;
        },
        applyReact: () => {
          applyReactCalled = true;
        },
      };

      const rp = new ReactPlayer({ plugins: [] });
      rp.registerPlugin(dualPlugin);

      expect(applyCalled).toBe(true);
      expect(applyReactCalled).toBe(true);
    });

    it("should call applyReact for a plugin with only applyReact", () => {
      let applyReactCalled = false;
      const reactPlugin: ReactPlayerPlugin = {
        name: "react-only-plugin",
        applyReact: () => {
          applyReactCalled = true;
        },
      };

      const rp = new ReactPlayer({ plugins: [] });
      rp.registerPlugin(reactPlugin);

      expect(applyReactCalled).toBe(true);
      expect(rp.options.plugins).toContain(reactPlugin);
    });

    it("should initialize plugins array if undefined", () => {
      const plugin: ReactPlayerPlugin = {
        name: "test-plugin",
      };

      const rp = new ReactPlayer({});
      rp.registerPlugin(plugin);

      expect(rp.options.plugins).toContain(plugin);
    });
  });
});
