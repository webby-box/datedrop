import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40",
  {
    variants: {
      variant: {
        default: "bg-[#c45c26] text-[#f4ead5] hover:bg-[#d66a30]",
        amber: "bg-[#d4a574] text-[#0c0b09] hover:bg-[#e2b88a]",
        outline:
          "border border-[rgba(244,234,213,0.18)] bg-transparent text-[#f4ead5] hover:bg-white/5",
        ghost: "text-[#f4ead5] hover:bg-white/5",
        link: "text-[#d4a574] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-7 text-base",
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
