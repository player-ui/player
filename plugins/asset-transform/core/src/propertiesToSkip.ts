import type { BeforeTransformFunction } from "@player-ui/player";

/**
 * Passes a property to the plugins.stringResolver.propertiesToSkip array or creates it if it doesn't exist
 *
 * @param asset - Asset to apply the transform to
 */
export const propertiesToSkipTransform = (
  parameters: string[],
): BeforeTransformFunction => {
  return (asset) => {
    const skipArray = asset.plugins?.stringResolver?.propertiesToSkip ?? [];

    /** makes sure there are no empty strings in the array */
    const parameterArray = parameters.filter((element) => {
      return element !== "";
    });

    if (parameterArray.length === 0) {
      return asset;
    }

    if (
      skipArray.length > 0 &&
      skipArray.every((arr) => parameterArray.includes(arr)) &&
      parameterArray.every((arr) => skipArray.includes(arr))
    ) {
      return asset;
    }

    const addParams: Set<string> = new Set([...skipArray, ...parameterArray]);

    return {
      ...asset,
      plugins: {
        ...asset.plugins,
        stringResolver: {
          ...asset?.plugins?.stringResolver,
          propertiesToSkip: [...addParams],
        },
      },
    };
  };
};
