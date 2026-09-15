import React from "react";
import { Meta, StoryObj } from "@storybook/react-webpack5";
import { PlayerStory } from "@player-ui/storybook";
import type { Flow } from "@player-ui/react";
import {
  PagedStreamingDataLoader,
  StreamingDataPlugin,
} from "@player-ui/streaming-data-plugin";
import type { PagedDataResult } from "@player-ui/streaming-data-plugin";

const meta: Meta = {
  title: "React Player/Streaming Data",
};

export default meta;

interface LedgerRecord {
  /** Unique id for the record */
  id: string;

  /** Display name */
  description: string;

  /** Category enum */
  category: string;

  /** Dollar amount as a numeric string */
  amount: string;

  /** ISO settled date */
  settledDate: string;
}

const PAGE_COUNT = 40;
const PAGE_SIZE = 250;
const PAGE_DELAY_MS = 120;

const LEADS = ["Quartz", "Harbor", "Willow", "Summit", "Meadow", "Juniper"];
const TAILS = ["Holdings", "Ventures", "Partners", "Industries", "Group"];
const CATEGORIES = ["equity", "fund", "bond", "crypto", "cash"];

/** Deterministic PRNG so every story run shows the same data */
const lcg = (seed: number) => {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
};

/** Build one page of demo records */
const makePage = (pageIndex: number): Array<LedgerRecord> => {
  const random = lcg(pageIndex + 1);

  return Array.from({ length: PAGE_SIZE }, (_, i) => {
    const index = pageIndex * PAGE_SIZE + i;

    return {
      id: `row-${index}`,
      description: `${LEADS[Math.floor(random() * LEADS.length)]} ${
        TAILS[Math.floor(random() * TAILS.length)]
      } ${1 + Math.floor(random() * 400)}`,
      category: CATEGORIES[Math.floor(random() * CATEGORIES.length)],
      amount: (Math.round(random() * 500000) / 100).toFixed(2),
      settledDate: `2023-0${1 + Math.floor(random() * 9)}-0${
        1 + Math.floor(random() * 9)
      }`,
    };
  });
};

/**
 * A demo loader that "fetches" a page every 120ms so the progressive loading
 * is visible. A real implementation would call a backend here (and pass the
 * AbortSignal to fetch).
 */
class DemoLedgerLoader extends PagedStreamingDataLoader<LedgerRecord> {
  protected async fetchPage(
    pageIndex: number,
    signal: AbortSignal,
  ): Promise<PagedDataResult<LedgerRecord>> {
    await new Promise((resolve) => setTimeout(resolve, PAGE_DELAY_MS));

    if (signal.aborted) {
      return { records: [], hasMore: false };
    }

    return { records: makePage(pageIndex), totalPages: PAGE_COUNT };
  }
}

const streamingDataPlugin = new StreamingDataPlugin({
  binding: "ledger",
  loader: new DemoLedgerLoader(),
});

const text = (id: string, value: string) => ({
  asset: { id, type: "text", value },
});

const action = (id: string, label: string, exp: string) => ({
  asset: {
    id,
    type: "action",
    exp,
    label: { asset: { id: `${id}-label`, type: "text", value: label } },
  },
});

const flow: Flow = {
  id: "streaming-data-demo",
  views: [
    {
      id: "view-1",
      type: "collection",
      label: {
        asset: {
          id: "title",
          type: "text",
          value: "Streaming 10,000 records into Player",
        },
      },
      values: [
        text(
          "progress",
          "Loaded {{ledgerStatus.loadedPages}} / {{ledgerStatus.totalPages}} pages ({{ledgerStatus.totalRecords}} records)",
        ),
        text(
          "state",
          "loading: {{ledgerStatus.loading}} | completed: {{ledgerStatus.completed}}",
        ),
        text("visible", "Rows in view after search/sort: {{ledger.length}}"),
        text(
          "row-0",
          "First row: {{ledger.0.description}} ({{ledger.0.category}}) ${{ledger.0.amount}} on {{ledger.0.settledDate}}",
        ),
        text(
          "row-1",
          "Second row: {{ledger.1.description}} ({{ledger.1.category}}) ${{ledger.1.amount}} on {{ledger.1.settledDate}}",
        ),
        text(
          "row-2",
          "Third row: {{ledger.2.description}} ({{ledger.2.category}}) ${{ledger.2.amount}} on {{ledger.2.settledDate}}",
        ),
        action(
          "sort-desc",
          "Sort by amount (high to low)",
          'sortStreamingData("ledger", "amount", "desc")',
        ),
        action(
          "sort-asc",
          "Sort by amount (low to high)",
          'sortStreamingData("ledger", "amount", "asc")',
        ),
        {
          asset: {
            id: "search-input",
            type: "input",
            binding: "searchQuery",
            label: {
              asset: {
                id: "search-input-label",
                type: "text",
                value: "Search (try 'quartz' or 'crypto')",
              },
            },
          },
        },
        action(
          "search",
          "Search",
          'searchStreamingData("ledger", {{searchQuery}})',
        ),
        action(
          "clear",
          "Clear search + sort",
          'clearStreamingDataQuery("ledger")',
        ),
      ],
    },
  ],
  data: {
    searchQuery: "",
  },
  navigation: {
    BEGIN: "FLOW_1",
    FLOW_1: {
      startState: "VIEW_1",
      VIEW_1: {
        state_type: "VIEW",
        ref: "view-1",
        transitions: {
          "*": "END_done",
        },
      },
      END_done: {
        state_type: "END",
        outcome: "done",
      },
    },
  },
};

/**
 * Streams 40 pages of 250 records into Player through the StreamingDataPlugin.
 * The records live in plugin memory (not Player's data model); the view reads
 * them and the pagination status through normal bindings, and the action
 * buttons drive the plugin's sort/search expressions.
 */
export const ProgressiveLoading: StoryObj = {
  render: () => (
    <PlayerStory flow={flow} options={{ plugins: [streamingDataPlugin] }} />
  ),
};
