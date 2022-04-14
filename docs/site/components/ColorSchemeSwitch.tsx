import React from 'react';
import { IconButton, useColorMode, useColorModeValue } from '@chakra-ui/react';
import { FaMoon, FaSun } from 'react-icons/fa';

export const ColorSchemeSwitch = () => {
  const { toggleColorMode } = useColorMode();
  const SwitchIcon = useColorModeValue(FaMoon, FaSun);
  const text = useColorModeValue('dark', 'light');

  return (
    <IconButton
      size="md"
      fontSize="lg"
      aria-label={`Switch to ${text} mode`}
      variant="ghost"
      color="current"
      ml={{ base: '0', md: '3' }}
      icon={<SwitchIcon />}
      onClick={toggleColorMode}
    />
  );
};
