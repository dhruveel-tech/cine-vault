import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "interactive-button group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:transition-transform",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-blue-600 via-blue-600 to-sky-500 text-white shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 active:shadow-md",
        destructive:
          "bg-red-600 text-white shadow-lg shadow-red-600/20 hover:bg-red-500 hover:shadow-xl hover:shadow-red-600/25 active:bg-red-700",
        outline:
          "border border-slate-200 bg-white text-slate-900 shadow-sm shadow-slate-950/5 hover:border-blue-300 hover:bg-blue-50/70 hover:text-blue-700 hover:shadow-md hover:shadow-blue-950/5 active:bg-blue-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:border-blue-500/60 dark:hover:bg-blue-500/10 dark:hover:text-blue-100 dark:hover:shadow-blue-950/20 dark:active:bg-blue-500/15",
        secondary:
          "border border-blue-100 bg-gradient-to-r from-white via-blue-50/80 to-sky-50 text-slate-900 shadow-md shadow-blue-950/10 hover:border-blue-200 hover:from-blue-50 hover:via-sky-50 hover:to-white hover:text-blue-700 hover:shadow-lg hover:shadow-blue-500/15 active:border-blue-300 active:from-blue-100 active:via-blue-50 active:to-white dark:border-slate-700 dark:bg-slate-800 dark:bg-none dark:text-slate-50 dark:shadow-black/20 dark:hover:border-blue-500/50 dark:hover:bg-blue-500/15 dark:hover:text-blue-100 dark:hover:shadow-blue-950/20 dark:active:bg-blue-500/20",
        ghost:
          "text-slate-700 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-blue-500/10 dark:hover:text-blue-100",
        link:
          "h-auto overflow-visible rounded-none p-0 text-blue-600 underline-offset-4 shadow-none hover:underline dark:text-blue-400"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-2xl px-7 text-base",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
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
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
