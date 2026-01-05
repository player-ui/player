import { Button, ButtonGroup, Code, VStack } from "@chakra-ui/react";
import { FallbackProps } from "@player-ui/react";
import React from "react";

export const ErrorHandler = (props: FallbackProps) => {
  return (
    <VStack gap="10">
      <Code colorScheme="red">
        <pre>{props.error?.message}</pre>
      </Code>
      <ButtonGroup>
        <Button variant="primary" onClick={props.retry}>
          Retry
        </Button>
        <Button variant="primary" onClick={props.reset}>
          Reset
        </Button>
      </ButtonGroup>
    </VStack>
  );
};
