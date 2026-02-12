import React from "react";
import leven from "leven";
import type { Asset as AssetType, AssetWrapper } from "@player-ui/player";
import type { Registry } from "@player-ui/partial-match-registry";
import { ErrorBoundary } from "react-error-boundary";
import { AssetRenderError } from "./AssetRenderError";

export * from "./AssetRenderError";

export type AssetRegistryType = Registry<React.ComponentType<any>>;

export interface ContextType {
  /**
   * A registry of Asset -> React Components
   */
  registry?: AssetRegistryType;
}

export const AssetContext: React.Context<ContextType> =
  React.createContext<ContextType>({});

const isAssetUnwrapped = (
  props: AssetType<string> | AssetWrapper<AssetType<string>>,
): props is AssetType<string> => {
  return "type" in props && "id" in props;
};

/**
 * A React Component that looks up an implementation from a registry
 */
export const ReactAsset = (
  props: AssetType<string> | AssetWrapper<AssetType<string>>,
): React.ReactElement => {
  const { registry } = React.useContext(AssetContext);

  let unwrapped: AssetType<string> | undefined;

  if (isAssetUnwrapped(props)) {
    unwrapped = props;
  } else if ("asset" in props) {
    unwrapped = props.asset;
  }

  if (!unwrapped) {
    throw Error(
      `Cannot determine asset type for props: ${JSON.stringify(props)}`,
    );
  }

  if (typeof unwrapped !== "object") {
    throw Error(
      `Asset was not an object got (${typeof unwrapped}) instead: ${unwrapped}`,
    );
  }

  if (unwrapped.type === undefined) {
    const info =
      unwrapped.id === undefined
        ? JSON.stringify(props)
        : `id: ${unwrapped.id}`;
    throw Error(`Asset is missing type for ${info}`);
  }

  if (!registry || registry.isRegistryEmpty()) {
    throw Error(`No asset found in registry. This could happen for one of the following reasons: \n
      1. You might have no assets registered or no plugins added to the Player instance. \n
      2. You might have mismatching versions of React Asset Registry Context. \n
      See https://player-ui.github.io/latest/tools/cli#player-dependency-versions-check for tips about how to debug and fix this problem`);
  }

  const Impl = registry?.get(unwrapped);

  if (!Impl) {
    const matchList: object[] = [];

    registry.forEach((asset) => {
      matchList.push(asset.key);
    });

    const typeList = matchList.map(
      (match) => JSON.parse(JSON.stringify(match)).type,
    );

    const similarType = typeList.reduce((prev, curr) => {
      const next = {
        value: leven(unwrapped.type, curr),
        type: curr,
      };

      if (prev !== undefined && prev.value < next.value) {
        return prev;
      }

      return next;
    }, undefined);

    throw Error(
      `No implementation found for id: ${unwrapped.id} type: ${unwrapped.type}. Did you mean ${similarType.type}? \n 
      Registered Asset matching functions are listed below: \n
      ${JSON.stringify(matchList)}`,
    );
  }

  return (
    <ErrorBoundary
      fallbackRender={(props) => {
        const { error, resetErrorBoundary } = props;

        resetErrorBoundary();
        if (error instanceof AssetRenderError) {
          error.addAssetParent(unwrapped);
          throw error;
        } else {
          throw new AssetRenderError(
            unwrapped,
            "Failed to render asset",
            error,
          );
        }
        return null;
      }}
    >
      <Impl key={unwrapped.id} {...unwrapped} />
    </ErrorBoundary>
  );
};

type AssetClassState = { currentError: Error };
export class ReactAssetClass extends React.Component<
  AssetType<string> | AssetWrapper<AssetType<string>>,
  AssetClassState
> {
  static contextType: typeof AssetContext = AssetContext;
  declare context: React.ContextType<typeof AssetContext>;

  static getDerivedStateFromError(err: Error): AssetClassState {
    return { currentError: err };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // const unwrapped = this.getUnwrappedAssetFromProps();
    // if (error instanceof AssetRenderError) {
    //   error.addAssetParent(unwrapped);
    //   throw error;
    // } else {
    //   throw new AssetRenderError(unwrapped, "Failed to render asset", error);
    // }
  }

  private getUnwrappedAssetFromProps(): AssetType<string> {
    const props: AssetType<string> | AssetWrapper<AssetType<string>> =
      this.props;

    if (isAssetUnwrapped(props)) {
      return props;
    } else if ("asset" in props) {
      return props.asset;
    }

    throw Error(
      `Cannot determine asset type for props: ${JSON.stringify(props)}`,
    );
  }

  render(): React.ReactNode {
    const props = this.props;
    const { registry } = this.context;

    const unwrapped = this.getUnwrappedAssetFromProps();

    if (typeof unwrapped !== "object") {
      throw Error(
        `Asset was not an object got (${typeof unwrapped}) instead: ${unwrapped}`,
      );
    }

    if (unwrapped.type === undefined) {
      const info =
        unwrapped.id === undefined
          ? JSON.stringify(props)
          : `id: ${unwrapped.id}`;
      throw Error(`Asset is missing type for ${info}`);
    }

    if (!registry || registry.isRegistryEmpty()) {
      throw Error(`No asset found in registry. This could happen for one of the following reasons: \n
      1. You might have no assets registered or no plugins added to the Player instance. \n
      2. You might have mismatching versions of React Asset Registry Context. \n
      See https://player-ui.github.io/latest/tools/cli#player-dependency-versions-check for tips about how to debug and fix this problem`);
    }

    const Impl = registry?.get(unwrapped);

    if (!Impl) {
      const matchList: object[] = [];

      registry.forEach((asset) => {
        matchList.push(asset.key);
      });

      const typeList = matchList.map(
        (match) => JSON.parse(JSON.stringify(match)).type,
      );

      const similarType = typeList.reduce((prev, curr) => {
        const next = {
          value: leven(unwrapped.type, curr),
          type: curr,
        };

        if (prev !== undefined && prev.value < next.value) {
          return prev;
        }

        return next;
      }, undefined);

      throw Error(
        `No implementation found for id: ${unwrapped.id} type: ${unwrapped.type}. Did you mean ${similarType.type}? \n 
      Registered Asset matching functions are listed below: \n
      ${JSON.stringify(matchList)}`,
      );
    }

    const error = this.state?.currentError;
    if (error) {
      this.setState({});
      if (error instanceof AssetRenderError) {
        error.addAssetParent(unwrapped);
        throw error;
      } else {
        throw new AssetRenderError(unwrapped, "Failed to render asset", error);
      }
    }

    return <Impl key={unwrapped.id} {...unwrapped} />;
  }
}
