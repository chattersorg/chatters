import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed dark:focus-visible:ring-offset-gray-800",
  {
    variants: {
      variant: {
        default: "bg-custom-black text-white hover:bg-custom-black-hover dark:bg-gray-800 dark:hover:bg-gray-700",
        primary: "bg-[#2548CC] text-white hover:bg-[#1e3ba8] dark:bg-[#2548CC] dark:hover:bg-[#1e3ba8]",
        destructive: "bg-custom-red text-white hover:bg-custom-red-hover dark:bg-custom-red dark:hover:bg-custom-red-hover",
        success: "bg-custom-green text-white hover:bg-custom-green-hover dark:bg-custom-green dark:hover:bg-custom-green-hover",
        info: "bg-custom-blue text-white hover:bg-custom-blue-hover dark:bg-custom-blue dark:hover:bg-custom-blue-hover",
        warning: "bg-custom-yellow text-white hover:bg-custom-yellow-hover dark:bg-custom-yellow dark:hover:bg-custom-yellow-hover",
        outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800",
        subtle: "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700",
        ghost: "hover:bg-gray-100 text-gray-700 dark:hover:bg-gray-800 dark:text-gray-200",
        link: "underline-offset-4 hover:underline text-blue-600 dark:text-blue-400",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, loading = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };