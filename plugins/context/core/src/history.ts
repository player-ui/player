import type { FrozenContextSnapshot } from "./types";

/**
 * Append-only stack of frozen per-flow snapshots. The plugin pushes one
 * snapshot on each flow end; consumers read via `entries()`.
 */
export class ContextHistory {
  private stack: FrozenContextSnapshot[] = [];

  push(snapshot: FrozenContextSnapshot): void {
    this.stack.push(snapshot);
  }

  entries(): ReadonlyArray<FrozenContextSnapshot> {
    return this.stack;
  }

  size(): number {
    return this.stack.length;
  }

  clear(): void {
    this.stack = [];
  }
}
