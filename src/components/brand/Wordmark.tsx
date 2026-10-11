import { cn } from "@/lib/utils";

interface WordmarkProps {
  className?: string;
  /** "light" keeps "Afri" white for use over photography */
  tone?: "auto" | "light";
}

/**
 * The Afrivogue wordmark: italic serif "Afri" in the text colour with a gold "Vogue".
 * Use it anywhere the brand name appears as a heading or logo; size it with text-* classes.
 */
const Wordmark = ({ className, tone = "auto" }: WordmarkProps) => (
  <span className={cn("whitespace-nowrap font-display font-normal normal-case italic tracking-tight", className)}>
    <span className={tone === "light" ? "text-white" : "text-foreground"}>Afri</span>
    <span className="text-gold">Vogue</span>
  </span>
);

export default Wordmark;
