import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-ring/60 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-white/55 bg-primary/88 text-primary-foreground hover:bg-primary",
        secondary: "border-white/60 bg-background/62 text-secondary-foreground hover:bg-background/78",
        destructive: "border-destructive/35 bg-destructive/90 text-destructive-foreground hover:bg-destructive",
        outline: "border-white/60 bg-background/56 text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
