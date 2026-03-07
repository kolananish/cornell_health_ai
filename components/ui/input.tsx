import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "h-11 w-full rounded-xl border border-[#d7d8e0] bg-white px-3 text-[15px] text-[#2f3036] outline-none transition focus:border-[#5a49e8] focus:shadow-[0_0_0_3px_rgba(90,73,232,0.14)]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
