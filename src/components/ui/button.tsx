import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f5f2]",
  {
    variants: {
      variant: {
        default: "bg-[#111] text-white hover:bg-black",
        amber: "bg-[#111] text-white hover:bg-black",
        outline:
          "border border-[rgba(17,17,17,0.16)] bg-transparent text-[#111] hover:bg-black/5",
        ghost: "text-[#111] hover:bg-black/5",
        light: "bg-white text-[#111] border border-[rgba(17,17,17,0.08)] hover:bg-[#f7f5f2]",
        link: "text-[#111] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 min-h-[44px]",
        sm: "h-9 px-3 text-xs min-h-[36px]",
        lg: "h-12 px-7 text-base min-h-[48px]",
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
