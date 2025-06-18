import React from "react";
import { FallbackProps } from "@player-ui/react";

export const ErrorHandler = (props: FallbackProps): React.JSX.Element => {
  return (
    <div>
      <text>
        <pre>{props.error?.message}</pre>
      </text>
      <div>
        <button onClick={props.retry}>Retry</button>
        <button onClick={props.reset}>Reset</button>
      </div>
    </div>
  );
};
