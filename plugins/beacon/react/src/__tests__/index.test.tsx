import { describe, test, vitest, expect } from "vitest";
import React from "react";
import { ReactPlayer } from "@player-ui/react";
import { findByTestId, render } from "@testing-library/react";
import { makeFlow } from "@player-ui/make-flow";
import { BeaconPlugin, useBeacon } from "..";

describe("beacon web plugin", () => {
  test("loads in a player", async () => {
    const beaconCallback = vitest.fn();

    const rp = new ReactPlayer({
      plugins: [
        new BeaconPlugin({
          callback: beaconCallback,
        }),
      ],
    });

    const flow = makeFlow({
      id: "action",
      type: "action",
      value: "Next",
    });

    rp.assetRegistry.set({ type: "action" }, (props: any) => {
      const beacon = useBeacon({ element: "button" });

      beacon();

      return <div data-testid={props.id}>{props.value}</div>;
    });
    rp.start(flow);

    const { container } = render(
      <div>
        <React.Suspense fallback="loading...">
          <rp.Component />
        </React.Suspense>
      </div>,
    );

    await findByTestId(container, "action");

    expect(rp.player.getState().status).toBe("in-progress");

    await vitest.waitFor(() => {
      expect(beaconCallback).toHaveBeenCalledWith(
        expect.objectContaining({ element: "button" }),
      );
    });
  });
});
