import React from 'react';
import { Flex } from '@chakra-ui/react';
import { Asset } from '@player-ui/react-asset';
import type { CollectionAsset } from '@player-ui/reference-assets-plugin';

export const Collection = (props: CollectionAsset) => {
  return (
    <Flex direction="column" gap="5">
      {props.label && (
        <h3>
          <Asset {...props.label} />
        </h3>
      )}
      {props.values?.map((a) => (
        <Asset key={a.asset.id} {...a} />
      ))}
    </Flex>
  );
};
