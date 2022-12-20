import React from 'react';
import { Container } from '@chakra-ui/react';
import { useReactPlayer } from '@player-ui/react';
import { ReferenceAssetsPlugin } from '@player-ui/reference-assets-plugin-react';
import { CommonTypesPlugin } from '@player-ui/common-types-plugin';

export const Player = (props: { mock: any; plugins: any[] }) => {
  const { mock, plugins } = props;
  const { reactPlayer, playerState } = useReactPlayer({
    plugins: [
      ...(plugins ?? []),
      new ReferenceAssetsPlugin(),
      new CommonTypesPlugin(),
    ],
  });

  React.useEffect(() => {
    reactPlayer.start(mock);
  }, [mock, plugins]);

  if (playerState.status === 'completed') {
    return <Container>Flow Complete</Container>;
  }

  return <reactPlayer.Component />;
};
