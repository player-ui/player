import type { Asset } from "@player-ui/player";
import type { A2UICommon, A2UIChildAsset } from "../common";

/** A single tab item — title + body component. */
export interface TabItem {
  title: string;
  child?: A2UIChildAsset;
}

/** Tabbed interface organizing content into switchable panels. */
export interface TabsAsset extends Asset<"Tabs">, A2UICommon {
  tabItems?: TabItem[];
}
