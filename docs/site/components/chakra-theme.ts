import { extendTheme } from '@chakra-ui/react';

export const colors = {
  transparent: 'transparent',
  black: '#000',
  white: '#fff',
  gray: {
    50: '#dee1e3',
    100: '#cfd3d7',
    200: '#bfc5c9',
    300: '#adb4b9',
    400: '#98a1a8',
    500: '#7f8b92',
    600: '#374147',
    700: '#374147',
    800: '#121212',
  },
  red: {},
  orange: {},
  yellow: {},
  green: {},
  teal: {},
  blue: {
    50: '#f6fafd',
    100: '#e2eff9',
    200: '#cce4f5',
    300: '#b5d8f0',
    400: '#9bcaeb',
    500: '#7dbae5',
    600: '#5aa7de',
    700: '#2d8fd5',
    800: '#0070b6',
    900: '#055393',
  },
  cyan: {},
  purple: {},
  pink: {},
};

export const theme = extendTheme({
  colors,
});
