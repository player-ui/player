import React from "react";
import type { ThrowingAsset } from "@player-ui/reference-assets-plugin";

/** A text asset */
export const Throwing = (props: ThrowingAsset): React.ReactElement => {
  if (props.timing === "render") {
    throw new Error(props.message);
  }

  return <p>Something is configured wrong if you are seeing this</p>;
};
