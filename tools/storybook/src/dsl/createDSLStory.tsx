import React, { StrictMode } from "react";
import { DSLPlayerStory } from "../player";

/** Create a story */
export function createDSLStory(
  loader: () => Promise<
    | string
    | {
        /** for dynamic imports */
        default: string;
      }
  >,
  options?: any,
) {
  /** The story to render */
  const Comp = () => {
    return (
      <StrictMode>
        <DSLPlayerStory dslContent={loader} options={options} />
      </StrictMode>
    );
  };

  if (options?.args) {
    Comp.args = options.args;
  }

  return {
    render: Comp,
  };
}
