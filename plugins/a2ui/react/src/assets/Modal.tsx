import React from "react";
import { ReactAsset } from "@player-ui/react";
import type { ModalAsset } from "@player-ui/a2ui-plugin";
import { cn, commonProps } from "../utils";

/**
 * Lightweight modal — no Radix dialog dep. The entry-point asset is rendered
 * inline and wrapped in a click target; clicking it toggles a controlled
 * overlay containing the content asset.
 */
export const Modal = (props: ModalAsset) => {
  const { id, entryPointChild, contentChild } = props;
  const [open, setOpen] = React.useState(false);

  return (
    <div id={id} {...commonProps(props)}>
      {entryPointChild && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="player-bg-transparent player-p-0 player-border-0"
        >
          <ReactAsset {...entryPointChild} />
        </button>
      )}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="player-fixed player-inset-0 player-z-50 player-flex player-items-center player-justify-center player-bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            className={cn(
              "player-bg-popover player-text-popover-foreground player-rounded-lg player-shadow-lg player-p-4 player-max-w-lg player-w-full player-mx-4",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {contentChild && <ReactAsset {...contentChild} />}
            <div className="player-mt-4 player-flex player-justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="player-text-sm player-underline player-text-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
