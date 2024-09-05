import React from "react";
import { ManagedPlayer, Flow, FlowManager } from "@player-ui/react";
import { ReferenceAssetsPlugin } from "@player-ui/reference-assets-plugin-react";
import "@player-ui/reference-assets-plugin-react/dist/index.css";
import {
  Box,
  VStack,
  Flex,
  Spinner,
  Button,
  Heading,
  HStack,
  Stack,
} from "@chakra-ui/react";
import { CodeHighlight } from "../code-highlight";
import { basicFlowManager } from "./sample-flows/sample-flow-manager";

export const PlayerDemo = () => {
  const config = React.useMemo(
    () => ({
      plugins: [new ReferenceAssetsPlugin()],
    }),
    [],
  );

  const [completed, setCompleted] = React.useState(false);

  const [currentFlow, setCurrentFlow] = React.useState<Flow | undefined>();

  const flowManager = React.useMemo<FlowManager>(() => {
    return {
      next: async (prev) => {
        const resp = await basicFlowManager.next(prev);

        if (resp.done) {
          setCurrentFlow(undefined);
        } else {
          setCurrentFlow((resp as any).value);
        }

        return resp;
      },
    };
  }, [setCurrentFlow]);

  return (
    <Stack
      gap={{ base: 20, md: "40" }}
      alignItems="center"
      direction={{ base: "column", lg: "row" }}
    >
      <Box
        w={{
          base: "100%",
          md: "calc(var(--chakra-sizes-md) + (2 * var(--chakra-space-4)))",
        }}
      >
        <CodeHighlight
          customStyle={{
            width: "100%",
          }}
          codeTagProps={{
            style: { height: "var(--shakra-sizes-sm)" },
          }}
          language="json"
        >
          {currentFlow
            ? JSON.stringify(currentFlow.views?.map((a) => a.title), null, 2)
            : "Start again"}
        </CodeHighlight>
      </Box>

      <Box
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="base"
        boxShadow="rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.1) 0px 4px 6px -1px, rgba(0, 0, 0, 0.06) 0px 2px 4px -1px"
      >
        <Flex
          alignItems="center"
          justifyContent="center"
          w={{
            base: "100%",
            md: "calc(var(--chakra-sizes-md) + (2 * var(--chakra-space-4)))",
          }}
          h="sm"
          overflowY="auto"
          p="4"
        >
          {completed && (
            <VStack gap="4">
              <Heading>Done!</Heading>
              <Button
                colorScheme="blue"
                variant="outline"
                onClick={() => {
                  setCompleted(false);
                }}
              >
                Start Over
              </Button>
            </VStack>
          )}
          {!completed && (
            <React.Suspense fallback={<Spinner size="xl" />}>
              <ManagedPlayer
                manager={flowManager}
                {...config}
                onComplete={() => {
                  setCompleted(true);
                }}
              />
            </React.Suspense>
          )}
        </Flex>
      </Box>
    </Stack>
  );
};
