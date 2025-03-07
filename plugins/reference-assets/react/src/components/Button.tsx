import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils";

const buttonVariants = cva(
  "player-inline-flex player-items-center player-justify-center player-whitespace-nowrap player-rounded-md player-text-sm player-font-medium player-transition-colors focus-visible:player-outline-none focus-visible:player-ring-1 focus-visible:player-ring-ring disabled:player-pointer-events-none disabled:player-opacity-50",
  {
    variants: {
      variant: {
        default:
          "player-bg-primary player-text-primary-foreground player-shadow hover:player-bg-primary/90",
        destructive:
          "player-bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "player-border player-border-input player-bg-primary player-text-primary-foreground player-shadow-sm hover:player-bg-accent hover:player-text-accent-foreground",
        secondary:
          "player-bg-secondary player-text-secondary-foreground player-shadow-sm hover:player-bg-secondary/80",
        ghost: "hover:player-bg-accent hover:player-text-accent-foreground",
        link: "player-text-primary player-underline-offset-4 hover:player-underline",
      },
      size: {
        default: "player-h-9 player-px-4 player-py-2",
        sm: "player-h-8 player-rounded-md player-px-3 player-text-xs",
        lg: "player-h-10 player-rounded-md player-px-8",
        icon: "player-h-9 player-w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
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
Button.displayName = "Button";

export { Button, buttonVariants };
