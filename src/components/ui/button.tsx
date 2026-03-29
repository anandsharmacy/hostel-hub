import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-white/55 bg-gradient-to-r from-primary/95 to-primary/80 text-primary-foreground shadow-[0_14px_26px_-18px_hsl(var(--nmims-maroon)/0.65)] hover:from-primary hover:to-primary/85 hover:-translate-y-0.5",
        destructive: "border border-destructive/30 bg-destructive/90 text-destructive-foreground hover:bg-destructive",
        outline:
          "border border-white/60 bg-background/60 backdrop-blur-md hover:bg-background/76 hover:border-white/80 hover:-translate-y-0.5",
        secondary:
          "border border-white/60 bg-background/62 text-secondary-foreground backdrop-blur-md hover:bg-background/78 hover:-translate-y-0.5",
        ghost: "hover:bg-background/62 hover:text-foreground border border-transparent hover:border-white/60",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
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
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
