import React from "react";
import * as LucideIcons from "lucide-react";
import type { IconAsset } from "@player-ui/a2ui-plugin";
import { commonProps } from "../utils";

/**
 * Maps the A2UI icon `name` to a lucide-react component. Falls back to a
 * neutral HelpCircle icon when the requested name isn't in the set so that
 * snapshots referencing unknown icons still render.
 */
function resolveIcon(name: string | undefined) {
  if (!name) return LucideIcons.HelpCircle;
  const pascal =
    name.charAt(0).toUpperCase() +
    name.slice(1).replace(/[-_](\w)/g, (_, c: string) => c.toUpperCase());
  const Lookup = (LucideIcons as unknown as Record<string, unknown>)[pascal];
  return (Lookup as typeof LucideIcons.HelpCircle) ?? LucideIcons.HelpCircle;
}

export const Icon = (props: IconAsset) => {
  const { id, name } = props;
  const Comp = resolveIcon(typeof name === "string" ? name : undefined);
  return (
    <Comp
      id={id}
      aria-label={
        props.accessibility ?? (typeof name === "string" ? name : undefined)
      }
      style={commonProps(props).style}
    />
  );
};
