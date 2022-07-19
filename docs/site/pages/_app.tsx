import React from 'react';
import type { AppProps, NextWebVitalsMetric } from 'next/app';
import { GoogleAnalytics, event, usePageViews } from 'nextjs-google-analytics';
import { ChakraProvider } from '@chakra-ui/react';
import { theme } from '../components/chakra-theme';
import { Context } from '../components/Context';
import './global.css';

// https://github.com/MauricioRobayo/nextjs-google-analytics#web-vitals
export function reportWebVitals({
  id,
  name,
  label,
  value,
}: NextWebVitalsMetric) {
  event(name, {
    category: label === 'web-vital' ? 'Web Vitals' : 'Next.js custom metric',
    value: Math.round(name === 'CLS' ? value * 1000 : value), // values must be integers
    label: id, // id unique to current page load
    nonInteraction: true, // avoids affecting bounce rate.
  });
}

const MyApp = ({ Component, pageProps }: AppProps) => {
  usePageViews();

  return (
    <>
      <GoogleAnalytics />
      <ChakraProvider theme={theme}>
        <Context>
          <Component {...pageProps} />
        </Context>
      </ChakraProvider>
    </>
  );
};

export default MyApp;
