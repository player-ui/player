import React from 'react';
import type { AppProps } from 'next/app';
import { ChakraProvider } from '@chakra-ui/react';
import { theme } from '../components/chakra-theme';
import { Context } from '../components/Context';
import './global.css';

const MyApp = ({ Component, pageProps }: AppProps) => {
  return (
    <ChakraProvider theme={theme}>
      <Context>
        <Component {...pageProps} />
      </Context>
    </ChakraProvider>
  );
};

export default MyApp;
