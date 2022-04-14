import React from 'react';
import { Asset } from '@player-ui/react-asset';
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
        {isBackAction(props) && <ChevronLeftIcon />}
        {label && (
          <Text>
            <Asset {...label} />
          </Text>
        )}
      </Button>
    </div>
  );
};
