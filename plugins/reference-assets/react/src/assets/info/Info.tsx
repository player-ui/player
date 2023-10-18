import React from 'react';
import type { InfoAssetTransform } from '@player-ui/reference-assets-plugin';
import { ReactAsset } from '@player-ui/react';
import {
  ButtonGroup,
  Box,
  Heading,
  Divider,
  Stack,
  HStack,
} from '@chakra-ui/react';

/** The info view type is used to show information to the user */
export const Info = (props: InfoAssetTransform) => {

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
          {props?.segmentedActions && <Divider />}
          <HStack justifyContent="space-between">
            <ButtonGroup spacing="6">
              {props?.segmentedActions?.prev?.map((a) => (
                <ReactAsset key={a.asset.id} {...a} />
              ))}
            </ButtonGroup>
            <ButtonGroup spacing="6">
              {props?.segmentedActions?.next?.map((a) => (
                <ReactAsset key={a.asset.id} {...a} />
              ))}
            </ButtonGroup>
          </HStack>
        </Stack>
      </Stack>
    </Box>
  );
};
