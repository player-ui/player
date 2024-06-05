import { describe, test, vitest, expect, beforeEach } from "vitest";
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
  describe("Input", () => {
    test("beacons the correct custom data value", async () => {
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

  describe("Choice", () => {
    let handler, beaconPlugin, rp, items, flow;

    beforeEach(async () => {
      handler = vitest.fn();
      beaconPlugin = new BeaconPlugin({ callback: handler });

      rp = new ReactPlayer({
        plugins: [beaconPlugin, new ReferenceAssetsPlugin()],
      });

      items = [
        {
          id: "item-1",
          value: "Item 1",
          label: {
            asset: {
              id: "choice-without-note-items-0-label",
              type: "text",
              value: "Item 1",
            },
          },
        },
        {
          id: "item-2",
          value: "Item 2",
          label: {
            asset: {
              id: "choice-without-note-items-1-label",
              type: "text",
              value: "Item 2",
            },
          },
        },
      ];

      flow = makeFlow({
        id: "choice",
        type: "choice",
        binding: "foo.bar",
        metaData: { beacon: { custom_data: "{{foo.bar}}" } },
        items,
      });

      render(
        <React.Suspense fallback="fallback">
          <rp.Component />
        </React.Suspense>,
      );

      await act(async () => {
        rp.start(flow);
      });
    });

    test("beacon handler is called on each item click", async () => {
      for (const item of items) {
        const itemNode = await screen.findByTestId(item.id);

        act(() => {
          fireEvent.click(itemNode);
        });

        await waitFor(() => {
          expect(handler.mock.calls).toHaveLength(2);
        });

        expect(handler.mock.calls[1][0]).toMatchObject({
          assetId: "choice",
          action: "clicked",
        });
      }
    });

    test("each item is set to checked on click", async () => {
      for (const item of items) {
        let itemNode;

        itemNode = await screen.findByTestId(item.id);
        expect(itemNode.checked).toEqual(false);

        act(() => {
          fireEvent.click(itemNode);
        });

        itemNode = await screen.findByTestId(item.id);
        expect(itemNode.checked).toEqual(true);
      }
    });
  });
});
