import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(17,17,17,0.28)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-[var(--ink)] text-white hover:bg-black shadow-sm",
        amber: "bg-[var(--ink)] text-white hover:bg-black shadow-sm",
        outline:
          "border border-[var(--line-strong)] bg-transparent text-[var(--ink)] hover:bg-black/[0.04]",
        ghost: "text-[var(--ink)] hover:bg-black/[0.04]",
        light:
          "bg-white text-[var(--ink)] border border-[var(--line)] hover:bg-[var(--bg)] shadow-sm",
        link: "text-[var(--ink)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 min-h-[44px]",
        sm: "h-9 px-3.5 text-xs min-h-[36px]",
        lg: "h-12 px-7 text-[15px] min-h-[48px]",
        icon: "h-11 w-11 min-h-[44px] min-w-[44px]",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
