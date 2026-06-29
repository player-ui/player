import type {
  Asset,
  BeforeTransformFunction,
  TransformFunction,
} from "@player-ui/player";
import { compose, composeBefore } from "@player-ui/asset-transform-plugin";
import type { ButtonAsset, TransformedButton } from "./types";

/**
 * Attach `run()` to fire any `exp` (context-write expression) followed by a
 * `value` transition. Mirrors reference-assets `actionTransform`.
 */
const transform: TransformFunction<ButtonAsset, TransformedButton> = (
  button,
  options,
) => ({
  ...button,
  run() {
    if (button.exp) {
      options.evaluate(button.exp);
    }
    if (button.value) {
      options.transition?.(button.value);
    }
  },
});

/**
 * Skip string resolution on `exp` so expressions like
 * `{{agent.event.context.x}} = "..."` survive intact for evaluation.
 */
const expPropTransform: BeforeTransformFunction<Asset> = (asset) => {
  const skipArray = asset.plugins?.stringResolver?.propertiesToSkip;
  if (skipArray && skipArray.indexOf("exp") > -1) return asset;
  return {
    ...asset,
    plugins: {
      ...asset.plugins,
      stringResolver: {
        ...asset?.plugins?.stringResolver,
        propertiesToSkip: [
          ...(asset.plugins?.stringResolver?.propertiesToSkip ?? []),
          "exp",
        ],
      },
    },
  };
};

export const buttonTransform = compose(
  transform,
  composeBefore(expPropTransform),
);
