import * as React from "react";
import { cn } from "../utils";

const CardComp = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "player-rounded-lg player-border player-bg-card player-text-card-foreground player-shadow player-p-4",
      className,
    )}
    {...props}
  />
));
CardComp.displayName = "CardComp";

export { CardComp };
