import React, { useEffect } from "react";
import type { CompletedState } from "@player-ui/react";
import { BindingParser, LocalModel } from "@player-ui/react";
import { VStack, Code, Heading, Button, Text } from "@chakra-ui/react";

export type PlayerFlowSummaryProps = {
  /** Reset the flow */
  reset: () => void;
  /** The outcome of the flow */
  outcome?: string;
  /** The completed state of the flow */
  completedState?: CompletedState;
  /** Beacons sent in the flow */
  beacons?: unknown[];
  /** any error */
  error?: Error;
};

interface CompletedStorybookFlowData {
  /** The CompletedState of the flow */
  completedState?: CompletedState;

  get(path: string): unknown;

  /** Beacons that were fired during the flow */
  beacons: any[];
}

declare global {
  interface Window {
    /** Completed data from the player flow if it was successful */
    __PLAYER_COMPLETED_DATA__?: CompletedStorybookFlowData;
  }
}

/** A component to show at the end of a flow */
export const PlayerFlowSummary = (
  props: PlayerFlowSummaryProps,
): React.ReactElement => {
  useEffect(() => {
    const model = new LocalModel(props.completedState?.data);
    // Point back to local model for data lookups when
    // parsing a path
    const parser = new BindingParser({
      get: (binding) => model.get(binding),
    });
    window.__PLAYER_COMPLETED_DATA__ = {
      completedState: props.completedState,
      get: (path) => model.get(parser.parse(path)),
      beacons: props.beacons ?? [],
    };
    return () => {
      delete window.__PLAYER_COMPLETED_DATA__;
    };
  }, [props.completedState, props.beacons]);

  return (
    <VStack gap="10">
      <Heading>Flow Completed {props.error ? "with Error" : ""}</Heading>
      {props.completedState?.endState.outcome && (
        <Code>
          Outcome:{" "}
          <Text as="strong">{props.completedState?.endState.outcome}</Text>
        </Code>
      )}

      {props.error && (
        <Code colorScheme="red">
          <pre>{props.error?.message}</pre>
        </Code>
      )}

      <Button variant="solid" onClick={props.reset}>
        Reset
      </Button>
    </VStack>
  );
};
