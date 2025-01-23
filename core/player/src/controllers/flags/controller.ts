import dlv from "dlv";

import { PlayerFlags, Flag, DefaultFlags } from "./types";
import { SyncWaterfallHook } from "tapable-ts";

export class FlagController {
  private flags: PlayerFlags;

  constructor(flags?: PlayerFlags) {
    this.flags = { ...DefaultFlags, ...flags };
  }

  /** Hooks for the FlagsController */
  public readonly hooks: {
    /** Allow a plugin or integration to dynamically change a flag without setting it globally */
    overrideFlag: SyncWaterfallHook<[any, string]>;
  } = {
    overrideFlag: new SyncWaterfallHook(),
  };

  public updateFlags(newFlags: Partial<PlayerFlags>): void {
    this.flags = {
      ...this.flags,
      ...newFlags,
    };
  }

  public getFlag<T>(flag: Flag): T {
    const configuredFlag = dlv(this.flags, flag) as PlayerFlags[Flag];
    return this.hooks.overrideFlag.call(configuredFlag, flag);
  }
}
