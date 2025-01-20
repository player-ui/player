/* eslint-disable @typescript-eslint/no-empty-interface */
import * as React from "react";

import { cn } from "../utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "player-flex player-h-9 player-w-full player-rounded-md player-border player-border-input player-bg-transparent player-px-3 player-py-1 player-text-sm player-shadow-sm player-transition-colors file:player-border-0 file:player-bg-transparent file:player-text-sm file:player-font-medium placeholder:player-text-muted-foreground focus-visible:player-outline-none focus-visible:player-ring-1 focus-visible:player-ring-ring player-disabled:player-cursor-not-allowed disabled:player-opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
