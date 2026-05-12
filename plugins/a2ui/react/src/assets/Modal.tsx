import React from "react";
import { ReactAsset } from "@player-ui/react";
import type { ModalAsset } from "@player-ui/a2ui-plugin";
import { cn, commonProps } from "../utils";
import { useModalTrigger } from "../components/modalBus";

/**
 * Lightweight modal — no Radix dialog dep. The entry-point asset is rendered
 * directly (e.g. as a `Button`) and signals open via the module-level modal
 * bus; this Modal subscribes by the trigger's component id. That avoids the
 * `<button>`-inside-`<button>` HTML nesting issue from wrapping the trigger.
 */
export const Modal = (props: ModalAsset) => {
  const { id, entryPointChild, contentChild } = props;
  const [open, setOpen] = React.useState(false);

  const triggerId = entryPointChild?.asset?.id;
  const onOpen = React.useCallback(() => setOpen(true), []);
  useModalTrigger(triggerId, onOpen);

  return (
    <div id={id} {...commonProps(props)}>
      {entryPointChild && <ReactAsset {...entryPointChild} />}
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
