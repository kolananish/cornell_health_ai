import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "min-h-[96px] w-full rounded-xl border border-[#d7d8e0] bg-white px-3 py-2 text-[15px] text-[#2f3036] outline-none transition focus:border-[#5a49e8] focus:shadow-[0_0_0_3px_rgba(90,73,232,0.14)]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
