import type { PropsWithChildren } from 'react';
import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';

export const StoryWrapper = (props: PropsWithChildren<any>) => {
  return (
    <ChakraProvider>
      <div style={{ padding: '20px' }}>{props.children}</div>
    </ChakraProvider>
  );
};
