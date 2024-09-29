import React from "react";
import type {
  TextAsset,
  LinkModifier,
} from "@player-ui/reference-assets-plugin";
import { useText } from "./hooks";

/** Find any link modifiers on the text */
export const getLinkModifier = (asset: TextAsset): LinkModifier | undefined => {
  return asset.modifiers?.find(
    (mod) =>
      mod.type === "link" &&
      (mod.metaData as LinkModifier["metaData"])?.ref !== undefined,
  ) as LinkModifier;
};

/** A text asset */
export const Text = (props: TextAsset) => {
  const spanProps = useText(props);
  const linkModifier = getLinkModifier(props);
  const { value } = props;

  if (linkModifier) {
    return (
      <a
        className="player-underline player-text-blue-600 hover:player-text-blue-800 visited:player-text-purple-600"
        href={linkModifier.metaData.ref}
      >
        {value}
      </a>
    );
  }

  return <span {...spanProps}>{value}</span>;
};
