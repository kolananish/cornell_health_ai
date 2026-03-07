import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Option = {
  value: string;
  label: string;
};

type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  className?: string;
  disabled?: boolean;
};

export function Select({ value, onChange, options, className, disabled }: SelectProps) {
  return (
    <div className={cn("relative", className)}>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full appearance-none rounded-xl border border-[#d7d8e0] bg-white px-3 pr-9 text-[15px] text-[#2f3036] outline-none transition focus:border-[#5a49e8] focus:shadow-[0_0_0_3px_rgba(90,73,232,0.14)]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6a6c79]" size={18} />
    </div>
  );
}
