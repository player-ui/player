import React from "react";
import { Link } from "@chakra-ui/react";
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
    return <Link href={linkModifier.metaData.ref}>{value}</Link>;
  }

  return <span {...spanProps}>{value}</span>;
};
