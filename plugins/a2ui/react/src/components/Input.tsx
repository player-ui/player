/* eslint-disable @typescript-eslint/no-empty-object-type */
import * as React from "react";
import { cn } from "../utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const InputComp = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "player-flex player-h-9 player-w-full player-rounded-md player-border player-border-input player-bg-transparent player-px-3 player-py-1 player-text-sm player-shadow-sm player-transition-colors placeholder:player-text-muted-foreground focus-visible:player-outline-none focus-visible:player-ring-1 focus-visible:player-ring-ring disabled:player-cursor-not-allowed disabled:player-opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
InputComp.displayName = "InputComp";

export { InputComp };
