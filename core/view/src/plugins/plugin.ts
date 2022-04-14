import type { SyncHook } from 'tapable';
import type { Resolver } from '../resolver';
import type { Parser } from '../parser';

/** The basic view api */
export interface View {
  /** The hooks for a view */
  hooks: {
    /** A hook when a parser is created for this view */
    parser: SyncHook<Parser>;

    /** A hook when a resolver is created for this view */
    resolver: SyncHook<Resolver>;
  };
}

/** A plugin for a view */
export interface ViewPlugin {
  /** Called with a view instance */
  apply(view: View): void;
}
