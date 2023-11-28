import React from "react";
import { Flex } from "@chakra-ui/react";
import { ReactAsset } from "@player-ui/react";
import type { CollectionAsset } from "@player-ui/reference-assets-plugin";

export const Collection = (props: CollectionAsset) => {
  return (
    <Flex direction="column" gap="5">
      {props.label && (
        <h3>
          <ReactAsset {...props.label} />
        </h3>
      )}
      {props.values?.map((a) => <ReactAsset key={a.asset.id} {...a} />)}
    </Flex>
  );
};
