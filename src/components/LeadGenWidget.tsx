import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface LeadGenWidgetProps {
  variant?: "inline" | "banner" | "sidebar";
  category?: string;
}

const LeadGenWidget = ({ variant = "inline", category }: LeadGenWidgetProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email, source: category ? `lead-${category}` : `lead-${variant}` });

    setLoading(false);

    if (error && error.code !== "23505") {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    setSuccess(true);
    localStorage.setItem("afrivogue_newsletter", "true");
  };

  if (success) {
    return (
      <div className={`rounded-lg border border-gold/20 bg-card p-6 text-center ${variant === "banner" ? "my-10" : "my-6"}`}>
        <p className="font-display text-lg font-bold text-gold">You're In ◆</p>
        <p className="mt-2 font-body text-sm text-muted-foreground">
          Watch your inbox for the latest from Afrivogue.
        </p>
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <div className="my-10 w-full rounded-lg border border-border bg-card/80 px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <p className="font-body text-[10px] font-bold uppercase tracking-[0.3em] text-gold">
              {category ? `${category} Insider` : "Afrivogue Insider"}
            </p>
            <h3 className="mt-1 font-display text-lg font-bold leading-snug text-foreground sm:text-xl">
              Get curated {category?.toLowerCase() || "trend"} insights weekly
            </h3>
            <p className="mt-1 font-body text-xs text-muted-foreground sm:text-sm">
              Join 10,000+ industry leaders receiving our editorial briefings.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2 sm:flex-row md:w-auto md:shrink-0">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full rounded-sm border border-border bg-background px-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none md:w-56 lg:w-64"
            />
            <button
              type="submit"
              disabled={loading}
              className="whitespace-nowrap rounded-sm bg-gold px-5 py-2.5 font-body text-xs font-bold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "…" : "Subscribe"}
            </button>
          </form>
        </div>
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
        <form onSubmit={handleSubmit} className="mt-4 space-y-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="w-full rounded-sm border border-border bg-background px-3 py-2 font-body text-xs text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-sm bg-gold px-3 py-2 font-body text-[10px] font-bold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "…" : "Subscribe"}
          </button>
        </form>
      </div>
    );
  }

  // inline variant
  return (
    <div className="my-8 rounded-lg border border-border bg-card p-6 text-center">
      <p className="font-body text-[10px] font-bold uppercase tracking-[0.3em] text-gold">
        Don't Miss a Signal
      </p>
      <h3 className="mt-2 font-display text-lg font-bold text-foreground">
        Subscribe to the Afrivogue Feed
      </h3>
      <form onSubmit={handleSubmit} className="mx-auto mt-4 flex max-w-sm gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="flex-1 rounded-sm border border-border bg-background px-3 py-2 font-body text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-sm bg-gold px-4 py-2 font-body text-xs font-bold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "…" : "Join"}
        </button>
      </form>
    </div>
  );
};

export default LeadGenWidget;
