interface PageMastheadProps {
  /** small uppercase label above the title */
  eyebrow?: string;
  title: string;
  /** optional gold-accented second word/phrase appended to the title */
  accent?: string;
  intro?: string;
  /** right-hand metadata slot in the top rule bar */
  meta?: string;
}

/**
 * Shared editorial page header: hairline rule bar with small-caps metadata,
 * then an oversized italic display title. Matches the homepage masthead.
 */
const PageMasthead = ({ eyebrow, title, accent, intro, meta }: PageMastheadProps) => (
  <header className="px-6 pt-28 md:px-12 lg:px-16">
    <div className="mx-auto max-w-7xl">
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <span className="font-body text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
          {eyebrow || "Afrivogue"}
        </span>
        <span className="hidden font-body text-[9px] uppercase tracking-[0.4em] text-muted-foreground md:block">
          Global Fashion · Culture · Lifestyle
        </span>
        <span className="font-body text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
          {meta || "Lagos / London"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 pb-10 pt-12 md:grid-cols-12 md:gap-8">
        <h1 className="font-display text-5xl italic leading-[0.9] tracking-tight text-foreground md:col-span-7 md:text-7xl">
          {title}
          {accent && <span className="text-gold"> {accent}</span>}
        </h1>
        {intro && (
          <p className="self-end font-body text-xs uppercase leading-relaxed tracking-[0.18em] text-muted-foreground md:col-span-5 md:pl-10">
            {intro}
          </p>
        )}
      </div>
    </div>
  </header>
);

export default PageMasthead;
