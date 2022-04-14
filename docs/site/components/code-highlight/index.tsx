import React from 'react';
import { Box, useColorModeValue } from '@chakra-ui/react';
import {
  Prism as SyntaxHighlighter,
  SyntaxHighlighterProps,
} from 'react-syntax-highlighter';

import { light, dark } from './prism-colors';

export const useCodeStyle = () => {
  const style = useColorModeValue(light, dark);

  return style;
};

export const CodeHighlight = (props: SyntaxHighlighterProps) => {
  const borderColor = useColorModeValue('gray.100', 'gray.800');

  return (
    <Box borderWidth="1px" borderColor={borderColor} borderRadius="base" my="4">
      <SyntaxHighlighter
        wrapLongLines
        style={useCodeStyle()}
        {...props}
        customStyle={{
          margin: 0,
        }}
      />
    </Box>
  );
};
