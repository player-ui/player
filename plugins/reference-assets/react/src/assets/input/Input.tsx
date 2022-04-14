import React from 'react';
import { Asset } from '@player-ui/react-asset';
import type { TransformedInput } from '@player-ui/reference-assets-plugin';
import {
  Input as ChakraInput,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
} from '@chakra-ui/react';
import { useInputAsset } from './hooks';

/** An Input */
export const Input = (props: TransformedInput) => {
  const { validation, label, id, note } = props;
  const inputProps = useInputAsset(props);

  return (
    <FormControl isInvalid={Boolean(validation)}>
      {label && (
        <FormLabel htmlFor={id}>
          <Asset {...label} />
        </FormLabel>
      )}
      <ChakraInput id={id} size="md" {...inputProps} />
      {validation && <FormErrorMessage>{validation.message}</FormErrorMessage>}
      {note && (
        <FormHelperText>
          <Asset {...note} />
        </FormHelperText>
      )}
    </FormControl>
  );
};

export default Input;
