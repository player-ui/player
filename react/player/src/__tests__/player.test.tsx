import { useSubscribedState } from "@player-ui/react-subscribe";
import { act, render, screen, waitFor } from "@testing-library/react";
import React, { Suspense, type ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";
import { ReactPlayer, type ReactPlayerPlugin } from "../player";
import { Asset, InProgressState, NotStartedState } from "@player-ui/player";
import { makeFlow } from "@player-ui/make-flow";

type ErrorViewProps = Asset<"throwing"> & {
  shouldThrow: boolean;
  displayValue: string;
};

const makeViewForErrorFlow = (
  shouldThrow: boolean,
  displayValue: string,
): ErrorViewProps => ({
  type: "throwing",
  id: "view-3",
  shouldThrow,
  displayValue,
});

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
    reactPlayer.assetRegistry.set(
      { type: "throwing" },
      (props: ErrorViewProps) => {
        if (props.shouldThrow) {
          throw new Error(
            `Error for '${props.id}' with display value '${props.displayValue}'`,
          );
        }
        return (
          <div id={props.id} data-testid={props.id}>
            {props.displayValue}
          </div>
        );
      },
    );
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

  describe("Error Handling", () => {
    it("should render nothing when an unrecoverable error occurs", async () => {
      let rp: ReactPlayer;

      const errorHandler = vi.fn(() => false);
      const TestPlugin: ReactPlayerPlugin = {
        name: "test-plugin",
        applyReact: (reactPlayer) => {
          rp = reactPlayer;
          registerAssets(reactPlayer);
          registerWebComponent(reactPlayer);
        },
        apply: (player) => {
          player.hooks.errorController.tap("test", (errController) => {
            errController.hooks.onError.tap("test", errorHandler);
          });
        },
      };

      const { findByTestId } = renderWithPlugin([TestPlugin]);
      await waitFor(() => {
        expect(rp).toBeDefined();
      });

      // 1. Publish a non-throwing view to ensure everything renders.
      await act(() => {
        rp.player
          .start(makeFlow(makeViewForErrorFlow(false, "First Value")))
          .catch(() => {});
      });

      const viewElement = await findByTestId("view-3");
      expect(viewElement).toHaveTextContent("First Value");

      // 2. Publish a throwing and check that view renders nothing
      await act(() => {
        rp.viewUpdateSubscription.publish(
          makeViewForErrorFlow(true, "Second Value"),
        );
      });

      await expect(findByTestId("view-3")).rejects.toThrow();
      expect(errorHandler).toHaveBeenCalled();

      // 3. Publish a new view that doesn't throw and see no recovery
      await act(() => {
        rp.viewUpdateSubscription.publish(
          makeViewForErrorFlow(false, "Third Value"),
        );
      });

      await expect(findByTestId("view-3")).rejects.toThrow();
    });

    it("should render nothing and not deal with errors outside of an in-progress state", async () => {
      let rp: ReactPlayer;

      const errorHandler = vi.fn(() => true);
      const TestPlugin: ReactPlayerPlugin = {
        name: "test-plugin",
        applyReact: (reactPlayer) => {
          rp = reactPlayer;
          registerAssets(reactPlayer);
          registerWebComponent(reactPlayer);
        },
        apply: (player) => {
          player.hooks.errorController.tap("test", (errController) => {
            errController.hooks.onError.tap("test", errorHandler);
          });
        },
      };

      const { findByTestId } = renderWithPlugin([TestPlugin]);
      await waitFor(() => {
        expect(rp).toBeDefined();
      });

      // 1. Publish a non-throwing view to ensure everything renders.
      await act(() => {
        rp.viewUpdateSubscription.publish(
          makeViewForErrorFlow(false, "First Value"),
        );
      });

      const viewElement = await findByTestId("view-3");
      expect(viewElement).toHaveTextContent("First Value");

      // 2. Publish a throwing and check that view renders nothing
      await act(() => {
        rp.viewUpdateSubscription.publish(
          makeViewForErrorFlow(true, "Second Value"),
        );
      });

      await expect(findByTestId("view-3")).rejects.toThrow();
      expect(errorHandler).not.toHaveBeenCalled();

      // 3. Publish a new view that doesn't throw and see no recovery
      await act(() => {
        rp.viewUpdateSubscription.publish(
          makeViewForErrorFlow(false, "Third Value"),
        );
      });

      await expect(findByTestId("view-3")).rejects.toThrow();
    });

    it("should render the previous view on error and new view on update when error recovery is enabled", async () => {
      let rp: ReactPlayer;

      const errorHandler = vi.fn(() => true);
      const TestPlugin: ReactPlayerPlugin = {
        name: "test-plugin",
        applyReact: (reactPlayer) => {
          rp = reactPlayer;
          registerAssets(reactPlayer);
          registerWebComponent(reactPlayer);
        },
        apply: (player) => {
          player.hooks.errorController.tap("test", (errController) => {
            errController.hooks.onError.tap("test", errorHandler);
          });
        },
      };

      const { findByTestId } = renderWithPlugin([TestPlugin]);
      await waitFor(() => {
        expect(rp).toBeDefined();
      });

      // 1. Publish a non-throwing view to ensure everything renders.
      await act(() => {
        rp.player.start(makeFlow(makeViewForErrorFlow(false, "First Value")));
      });

      let viewElement = await findByTestId("view-3");
      expect(viewElement).toHaveTextContent("First Value");
      expect(errorHandler).not.toHaveBeenCalled();

      // 2. Publish a throwing and check that view renders nothing
      await act(() => {
        rp.viewUpdateSubscription.publish(
          makeViewForErrorFlow(true, "Second Value"),
        );
      });

      await vi.waitFor(() => {
        expect(errorHandler).toHaveBeenCalled();
      });
      viewElement = await findByTestId("view-3");
      expect(viewElement).toHaveTextContent("First Value");

      // 3. Publish a new view that doesn't throw and see recovery
      await act(() => {
        rp.viewUpdateSubscription.publish(
          makeViewForErrorFlow(false, "Third Value"),
        );
      });

      viewElement = await findByTestId("view-3");
      expect(viewElement).toHaveTextContent("Third Value");
    });
  });
});
