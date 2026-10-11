import { cn } from "@/lib/utils";
import { categoryColor } from "@/lib/categoryColors";

interface CategoryChipProps {
  category: string;
  /** "solid" sits on images; "soft" sits on page backgrounds */
  variant?: "solid" | "soft";
  className?: string;
}

/** Rounded category pill tinted with that category's colour. */
const CategoryChip = ({ category, variant = "soft", className }: CategoryChipProps) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-body text-[10px] font-semibold uppercase tracking-[0.14em]",
      variant === "solid" ? "text-white shadow-sm backdrop-blur-md" : "",
      className,
    )}
    style={
      variant === "solid"
        ? { backgroundColor: categoryColor(category, 0.92) }
        : { backgroundColor: categoryColor(category, 0.14), color: categoryColor(category) }
    }
  >
    {variant === "soft" && (
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: categoryColor(category) }} />
    )}
    {category}
  </span>
);

export default CategoryChip;
