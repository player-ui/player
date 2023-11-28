import { describe, test, vitest, expect } from "vitest";
import React from "react";
import {
  screen,
  render,
  act,
  fireEvent,
  waitFor,
  configure,
} from "@testing-library/react";
import { BeaconPlugin } from "@player-ui/beacon-plugin-react";
import { ReactPlayer } from "@player-ui/react";
import { makeFlow } from "@player-ui/make-flow";
import { ReferenceAssetsPlugin } from "../plugin";

configure({
  testIdAttribute: "id",
});

describe("Integration tests", () => {
  test("input beacons the correct custom data value", async () => {
    const handler = vitest.fn();
    const beaconPlugin = new BeaconPlugin({ callback: handler });

    const rp = new ReactPlayer({
      plugins: [beaconPlugin, new ReferenceAssetsPlugin()],
    });

    const flow = makeFlow({
      id: "first_view",
      type: "input",
      binding: "foo.bar",
      metaData: { beacon: { custom_data: "{{foo.bar}}" } },
    });

    render(
      <React.Suspense fallback="fallback">
        <rp.Component />
      </React.Suspense>,
    );

    await act(async () => {
      rp.start(flow);
    });

    const viewNode = await screen.findByTestId("first_view");

    act(() => {
      fireEvent.change(viewNode, { target: { value: "new value" } });
    });

    act(() => {
      fireEvent.blur(viewNode, { target: { value: "new value" } });
    });

    await waitFor(() => {
      expect(handler.mock.calls).toHaveLength(2);
    });

    expect(handler.mock.calls[1][0]).toMatchObject({
      assetId: "first_view",
      data: { custom_data: "new value" },
    });
  });
});
