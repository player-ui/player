import React from 'react';
import { ReactAsset } from '@player-ui/react';
import { Button, Text } from '@chakra-ui/react';
import { ChevronLeftIcon } from '@chakra-ui/icons';
import type { TransformedAction } from '@player-ui/reference-assets-plugin';
import { isBackAction } from '@player-ui/reference-assets-plugin';
import { useAction } from './hooks';

/**
 * An action that a user can take
 */
export const Action = (props: TransformedAction) => {
  const { label } = props;
  const buttonProps = useAction(props);

  return (
    <div>
      <Button
        variant={isBackAction(props) ? 'ghost' : 'solid'}
        {...buttonProps}
      >
        {props?.metaData?.role === 'back' && <ChevronLeftIcon />}
        {label && (
          <Text>
            <ReactAsset {...label} />
          </Text>
        )}
      </Button>
    </div>
  );
};
