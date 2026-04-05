import SubstackEmbed from "./SubstackEmbed";

interface LeadGenWidgetProps {
  variant?: "inline" | "banner" | "sidebar";
  category?: string;
}

const LeadGenWidget = ({ variant = "inline", category }: LeadGenWidgetProps) => {
  if (variant === "banner") {
    return (
      <div className="my-10 w-full rounded-lg border border-border bg-card/80 px-5 py-8 sm:px-8 sm:py-10">
        <div className="mb-6">
          <p className="font-body text-[10px] font-bold uppercase tracking-[0.3em] text-gold">
            {category ? `${category} Insider` : "Afrivogue Insider"}
          </p>
          <h3 className="mt-2 font-display text-xl font-bold leading-snug text-foreground sm:text-2xl">
            Get curated {category?.toLowerCase() || "trend"} insights weekly
          </h3>
          <p className="mt-2 font-body text-sm text-muted-foreground">
            Join 10,000+ industry leaders receiving our editorial briefings.
          </p>
        </div>
        <SubstackEmbed />
      </div>
    );
  }

  if (variant === "sidebar") {
    return (
      <div className="rounded-lg border border-gold/20 bg-card p-5">
        <p className="font-body text-[10px] font-bold uppercase tracking-[0.3em] text-gold">
          Stay Informed
        </p>
        <h4 className="mt-2 font-display text-base font-bold text-foreground">
          Weekly {category || "Trend"} Brief
        </h4>
        <p className="mt-2 font-body text-xs text-muted-foreground">
          Curated analysis delivered to your inbox.
        </p>
        <SubstackEmbed className="mt-4" />
      </div>
    );
  }

  return (
    <div className="my-8 rounded-lg border border-border bg-card p-6">
      <p className="font-body text-[10px] font-bold uppercase tracking-[0.3em] text-gold">
        Don't Miss a Signal
      </p>
      <h3 className="mt-2 font-display text-lg font-bold text-foreground">
        Subscribe to the Afrivogue Feed
      </h3>
      <p className="mt-2 font-body text-sm text-muted-foreground">
        Curated trend analysis delivered to your inbox.
      </p>
      <SubstackEmbed className="mt-4" />
    </div>
  );
};

export default LeadGenWidget;
