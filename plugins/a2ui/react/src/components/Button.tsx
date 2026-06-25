import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils";

const buttonVariants = cva(
  "player-inline-flex player-items-center player-justify-center player-whitespace-nowrap player-rounded-md player-text-sm player-font-medium player-transition-colors focus-visible:player-outline-none focus-visible:player-ring-1 focus-visible:player-ring-ring disabled:player-pointer-events-none disabled:player-opacity-50",
  {
    variants: {
      variant: {
        primary:
          "player-bg-primary player-text-primary-foreground player-shadow hover:player-bg-primary/90",
        secondary:
          "player-bg-secondary player-text-secondary-foreground player-shadow-sm hover:player-bg-secondary/80",
        outline:
          "player-border player-border-input player-bg-transparent player-text-foreground player-shadow-sm hover:player-bg-accent hover:player-text-accent-foreground",
        ghost: "hover:player-bg-accent hover:player-text-accent-foreground",
        destructive:
          "player-bg-destructive player-text-destructive-foreground player-shadow-sm hover:player-bg-destructive/90",
      },
      size: {
        default: "player-h-9 player-px-4 player-py-2",
        sm: "player-h-8 player-rounded-md player-px-3 player-text-xs",
        lg: "player-h-10 player-rounded-md player-px-8",
        icon: "player-h-9 player-w-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const ButtonComp = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
ButtonComp.displayName = "ButtonComp";

export { ButtonComp, buttonVariants };
