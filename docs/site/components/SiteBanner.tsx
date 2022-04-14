import React from 'react';
import { Alert, AlertIcon, Box, CloseButton } from '@chakra-ui/react';
import { AppContext } from './Context';

export const WarningBanner = (props: React.PropsWithChildren<unknown>) => {
  const { bannerExpanded, setBannerExpanded } = React.useContext(AppContext);

  if (!bannerExpanded) {
    return null;
  }

  return (
    <Alert status="warning">
      <AlertIcon />
      <Box flex={1}>{props.children}</Box>
      <CloseButton
        justifySelf="flex-end"
        onClick={() => {
          setBannerExpanded(false);
        }}
      />
    </Alert>
  );
};
