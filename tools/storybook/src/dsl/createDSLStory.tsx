import React from "react";
import { DSLPlayerStory } from "../player";

type AsyncDynamicImport = () => Promise<
  | string
  | {
      /** for dynamic imports */
      default: string;
    }
>;

/** Create a story */
export function createDSLStory(
  loader: AsyncDynamicImport,
  options?: {
    controlsLoader: AsyncDynamicImport;

    [key: string]: unknown;
  },
) {
  /** The story to render */
  const Comp = () => {
    return (
      <DSLPlayerStory
        dslContent={loader}
        controlsContent={() => {
          return options
            .controlsLoader()
            .then((v) => {
              if (typeof v === "object" && v.default) {
                return v.default as any;
              }

              return v;
            })
            .catch((e) => {
              debugger;
              console.error(e);
            });
        }}
      />
    );
  };

  if (options?.args) {
    Comp.args = options.args;
  }

  return {
    render: Comp,
  };
}
