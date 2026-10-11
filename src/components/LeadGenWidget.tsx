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

  const inputClass =
    "w-full rounded-full border border-border bg-background/80 px-5 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20";
  const buttonClass =
    "whitespace-nowrap rounded-full bg-gold px-6 py-3 font-body text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-50";

  if (success) {
    return (
      <div className={`rounded-3xl border border-gold/25 bg-sunset p-8 text-center ${variant === "banner" ? "" : "my-6"}`}>
        <p className="font-display text-2xl italic text-gold">You're in.</p>
        <p className="mt-2 font-body text-sm text-muted-foreground">Watch your inbox for the latest from Afrivogue.</p>
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <div className="relative w-full overflow-hidden rounded-3xl border border-gold/20 bg-sunset px-6 py-10 shadow-soft sm:px-10 md:px-14 md:py-14">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
          <div>
            <p className="font-body text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">
              {category ? `${category} Insider` : "The Afrivogue Insider"}
            </p>
            <h3 className="mt-3 font-display text-3xl italic leading-tight text-foreground md:text-4xl">
              Curated {category?.toLowerCase() || "trend"} insights, every week
            </h3>
            <p className="mt-3 max-w-md font-body text-sm leading-relaxed text-muted-foreground md:text-base">
              Join 10,000+ creatives and industry leaders who read our editorial briefing.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3 sm:flex-row lg:justify-end">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              aria-label="Email address"
              className={`${inputClass} sm:max-w-sm`}
            />
            <button type="submit" disabled={loading} className={buttonClass}>
              {loading ? "Subscribing…" : "Subscribe"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (variant === "sidebar") {
    return (
      <div className="rounded-3xl border border-gold/20 bg-sunset p-6">
        <p className="font-body text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">Stay informed</p>
        <h4 className="mt-2 font-display text-xl italic text-foreground">Weekly {category || "Trend"} Brief</h4>
        <p className="mt-2 font-body text-sm text-muted-foreground">Curated analysis delivered to your inbox.</p>
        <form onSubmit={handleSubmit} className="mt-5 space-y-2.5">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            aria-label="Email address"
            className={inputClass}
          />
          <button type="submit" disabled={loading} className={`${buttonClass} w-full`}>
            {loading ? "Subscribing…" : "Subscribe"}
          </button>
        </form>
      </div>
    );
  }

  // inline variant
  return (
    <div className="my-8 rounded-3xl border border-gold/20 bg-sunset p-6 md:p-8">
      <p className="font-body text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">Don't miss a signal</p>
      <h3 className="mt-2 font-display text-2xl italic text-foreground">Subscribe to the Afrivogue Feed</h3>
      <p className="mt-2 font-body text-sm text-muted-foreground">Curated trend analysis delivered to your inbox.</p>
      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          aria-label="Email address"
          className={inputClass}
        />
        <button type="submit" disabled={loading} className={buttonClass}>
          {loading ? "Joining…" : "Join"}
        </button>
      </form>
    </div>
  );
};

export default LeadGenWidget;
