import React from 'react';
import { VStack, Code, Heading, Button, Text } from '@chakra-ui/react';

export type PlayerFlowSummaryProps = {
  /** Reset the flow */
  reset: () => void;
  /** The outcome of the flow */
  outcome?: string;
  /** any error */
  error?: Error;
};

/** A component to show at the end of a flow */
export const PlayerFlowSummary = (props: PlayerFlowSummaryProps) => {
  return (
    <VStack gap="10">
      <Heading>Flow Completed {props.error ? 'with Error' : ''}</Heading>

      {props.outcome && (
        <Code>
          Outcome: <Text as="strong">{props.outcome}</Text>
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
