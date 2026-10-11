import type { ReactNode } from "react";

interface PageMastheadProps {
  /** small label above the title */
  eyebrow?: string;
  title: ReactNode;
  /** optional gold-accented word/phrase appended to the title */
  accent?: string;
  intro?: string;
  /** small right-aligned detail, e.g. a count */
  meta?: string;
}

/**
 * Page title block shown under the site header: eyebrow, large italic display
 * title and a short intro, set over a soft warm glow.
 */
const PageMasthead = ({ eyebrow, title, accent, intro, meta }: PageMastheadProps) => (
  <header className="relative overflow-hidden px-4 pb-10 pt-28 md:px-8 md:pb-14 md:pt-32 lg:px-12">
    <div
      aria-hidden
      className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[900px] max-w-[160vw] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
      style={{
        background:
          "radial-gradient(closest-side, hsl(var(--gold) / 0.22), hsl(var(--terracotta) / 0.08) 60%, transparent)",
      }}
    />
    <div className="relative mx-auto flex max-w-[1440px] flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        {eyebrow && (
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1.5 font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-5xl italic leading-[0.95] tracking-tight text-foreground md:text-7xl">
          {title}
          {accent && <span className="text-gold"> {accent}</span>}
        </h1>
        {intro && (
          <p className="mt-5 max-w-xl font-body text-base leading-relaxed text-muted-foreground md:text-lg">{intro}</p>
        )}
      </div>
      {meta && (
        <p className="shrink-0 font-body text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">{meta}</p>
      )}
    </div>
  </header>
);

export default PageMasthead;
