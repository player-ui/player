import type {
  Player,
  PlayerPlugin,
  TransformFunction,
} from "@player-ui/player";
import { AssetTransformPlugin } from "@player-ui/asset-transform-plugin";

/**
 * Shape of the `agui-input-bar` asset after transform. The component reads
 * `value`, calls `setValue(next)` to track local edits, and calls `send()` to
 * invoke the `agui_send` expression which pushes a user message and starts a
 * new run.
 */
export interface TransformedInputBar {
  id: string;
  type: "agui-input-bar";
  value?: string;
  isRunning?: boolean;
  error?: string;
  runId?: string | null;
  threadId?: string | null;
  inputBinding?: string;
  setValue(next: string): void;
  send(): void;
  [key: string]: unknown;
}

interface InputBarAsset {
  id: string;
  type: "agui-input-bar";
  value?: string;
  isRunning?: boolean;
  error?: string;
  runId?: string | null;
  threadId?: string | null;
  inputBinding?: string;
  [key: string]: unknown;
}

const inputBarTransform: TransformFunction<
  InputBarAsset,
  TransformedInputBar
> = (asset, options) => ({
  ...asset,
  setValue(next: string) {
    if (!asset.inputBinding) return;
    options.data.model.set([[asset.inputBinding, next]]);
  },
  send() {
    options.evaluate("agui_send()");
  },
});

/**
 * Attaches the input-bar transform so the React component has imperative
 * `setValue` / `send` methods that route through Player's data model + the
 * `agui_send` expression registered by `AGUIExpressionsPlugin`.
 */
export class AGUITransformPlugin implements PlayerPlugin {
  name = "ag-ui-transform";

  apply(player: Player): void {
    player.registerPlugin(
      new AssetTransformPlugin([
        [{ type: "agui-input-bar" }, inputBarTransform],
      ]),
    );
  }
}
