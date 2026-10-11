import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

interface SectionHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  /** optional "see all" link on the right */
  link?: { to: string; label: string };
  className?: string;
}

/** Left-aligned section heading with an optional "view all" pill on the right. */
const SectionHeader = ({ eyebrow, title, link, className = "" }: SectionHeaderProps) => (
  <div className={`mb-10 flex flex-wrap items-end justify-between gap-4 ${className}`}>
    <div>
      {eyebrow && (
        <p className="mb-3 font-body text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">{eyebrow}</p>
      )}
      <h2 className="font-display text-3xl italic leading-tight text-foreground md:text-5xl">{title}</h2>
    </div>
    {link && (
      <Link
        to={link.to}
        className="group inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-5 py-2.5 font-body text-xs font-medium text-foreground transition-all hover:border-gold hover:text-gold"
      >
        {link.label}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    )}
  </div>
);

export default SectionHeader;
