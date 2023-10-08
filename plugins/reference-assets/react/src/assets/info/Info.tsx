import React from 'react';
import type {
  ActionAsset,
  InfoAsset,
} from '@player-ui/reference-assets-plugin';
import { isBackAction } from '@player-ui/reference-assets-plugin';
import { ReactAsset } from '@player-ui/react';
import {
  ButtonGroup,
  Box,
  Heading,
  Divider,
  Stack,
  HStack,
} from '@chakra-ui/react';
import type { AssetWrapper } from '@player-ui/react';

/** The info view type is used to show information to the user */
export const Info = (props: InfoAsset) => {
  const segmentedActions = React.useMemo(() => {
    if (!props.actions?.length) {
      return;
    }

    return props.actions?.reduce(
      (memo, next) => {
        memo[isBackAction(next.asset as ActionAsset) ? 'prev' : 'next'].push(
          next as AssetWrapper<ActionAsset>
        );
        return memo;
      },
      { prev: [], next: [] } as {
        prev: Array<AssetWrapper<ActionAsset>>;
        next: Array<AssetWrapper<ActionAsset>>;
      }
    );
  }, [props.actions]);

  return (
    <Box minW={{ base: undefined, md: 'md' }}>
      <Stack gap="10">
        {props.title && (
          <Heading size="lg" as="h1">
            <ReactAsset {...props.title} />
          </Heading>
        )}
        {props.subTitle && (
          <Heading size="md" as="h3">
            <ReactAsset {...props.subTitle} />
          </Heading>
        )}
        <Box>{props.primaryInfo && <ReactAsset {...props.primaryInfo} />}</Box>
        <Stack gap="4">
          {segmentedActions && <Divider />}
          <HStack justifyContent="space-between">
            <ButtonGroup spacing="6">
              {segmentedActions?.prev?.map((a) => (
                <ReactAsset key={a.asset.id} {...a} />
              ))}
            </ButtonGroup>
            <ButtonGroup spacing="6">
              {segmentedActions?.next?.map((a) => (
                <ReactAsset key={a.asset.id} {...a} />
              ))}
            </ButtonGroup>
          </HStack>
        </Stack>
        {props.footer && (
          <ReactAsset {...props.footer} />
        )}
      </Stack>
    </Box>
  );
};
