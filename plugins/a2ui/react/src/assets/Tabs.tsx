import React from "react";
import { ReactAsset } from "@player-ui/react";
import type { TabsAsset } from "@player-ui/a2ui-plugin";
import { cn, commonProps } from "../utils";

export const Tabs = (props: TabsAsset) => {
  const { id, tabItems = [] } = props;
  const [active, setActive] = React.useState(0);
  const items = tabItems;
  const current = items[active];

  return (
    <div id={id} {...commonProps(props)}>
      <div
        role="tablist"
        className="player-flex player-gap-2 player-border-b player-border-border"
      >
        {items.map((t, i) => {
          const tabId = `${id}-tab-${i}`;
          const panelId = `${id}-panel-${i}`;
          return (
            <button
              key={i}
              id={tabId}
              role="tab"
              aria-selected={active === i}
              aria-controls={panelId}
              onClick={() => setActive(i)}
              className={cn(
                "player-px-3 player-py-2 player-text-sm player-font-medium",
                active === i
                  ? "player-border-b-2 player-border-primary player-text-primary"
                  : "player-text-muted-foreground",
              )}
            >
              {t.title}
            </button>
          );
        })}
      </div>
      {current && (
        <div
          role="tabpanel"
          id={`${id}-panel-${active}`}
          aria-labelledby={`${id}-tab-${active}`}
          className="player-py-2"
        >
          {current.child ? <ReactAsset {...current.child} /> : null}
        </div>
      )}
    </div>
  );
};
