import type { SyncHook } from "tapable-ts";
import type { Resolver } from "../resolver";
import type { Parser } from "../parser";
import { ViewInstance } from "../view";

/** A plugin for a view */
export interface ViewPlugin {
  /** Called with a view instance */
  apply(view: ViewInstance): void;
}
