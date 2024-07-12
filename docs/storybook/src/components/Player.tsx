import React from "react";
import { useReactPlayer } from "@player-ui/react";
import { ReferenceAssetsPlugin } from "@player-ui/reference-assets-plugin-react";
import { CommonTypesPlugin } from "@player-ui/common-types-plugin";

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

  if (playerState.status === "completed") {
    return <div>Flow Complete</div>;
  }

  return <reactPlayer.Component />;
};
