import React from "react";
import type { TextAsset, TextVariant } from "@player-ui/a2ui-plugin";
import { cn, commonProps } from "../utils";

const variantConfig: Record<
  TextVariant,
  { tag: keyof JSX.IntrinsicElements; cls: string }
> = {
  h1: { tag: "h1", cls: "player-text-4xl player-font-bold" },
  h2: { tag: "h2", cls: "player-text-3xl player-font-bold" },
  h3: { tag: "h3", cls: "player-text-2xl player-font-semibold" },
  h4: { tag: "h4", cls: "player-text-xl player-font-semibold" },
  h5: { tag: "h5", cls: "player-text-lg player-font-medium" },
  caption: {
    tag: "span",
    cls: "player-text-xs player-text-muted-foreground",
  },
  body: { tag: "p", cls: "player-text-base" },
};

export const Text = (props: TextAsset) => {
  const { id, text, variant = "body" } = props;
  const cfg = variantConfig[variant] ?? variantConfig.body;
  const Tag = cfg.tag;
  return (
    <Tag id={id} className={cn(cfg.cls)} {...commonProps(props)}>
      {String(text ?? "")}
    </Tag>
  );
};
