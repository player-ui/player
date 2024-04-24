import React from "react";
import { ReactAsset } from "@player-ui/react";
import { ChevronLeftIcon } from "lucide-react";
import type { TransformedAction } from "@player-ui/reference-assets-plugin";
import { isBackAction } from "@player-ui/reference-assets-plugin";
import { useAction } from "./hooks";
import { Button } from "../../components/Button";

/**
 * An action that a user can take
 */
export const Action = (props: TransformedAction) => {
  const { label } = props;
  const buttonProps = useAction(props);

  return (
    <div>
      <Button
        variant={isBackAction(props) ? "outline" : undefined}
        {...buttonProps}
      >
        {props?.metaData?.role === "back" && <ChevronLeftIcon />}
        {label && <ReactAsset {...label} />}
      </Button>
    </div>
  );
};
