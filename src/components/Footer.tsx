import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const socialLinks = [
  { label: "Instagram", href: "https://instagram.com/afrivogue", icon: "IG" },
  { label: "TikTok", href: "https://tiktok.com/@afrivogue", icon: "TT" },
  { label: "X", href: "https://x.com/afrivogue", icon: "X" },
  { label: "Pinterest", href: "https://pinterest.com/afrivogue", icon: "PT" },
  { label: "YouTube", href: "https://youtube.com/@afrivogue", icon: "YT" },
];

const exploreLinks = [
  { label: "Trends", href: "/" },
  { label: "Editorials", href: "/editorials" },
  { label: "Forecast", href: "/forecast" },
  { label: "Moodboard", href: "/moodboard" },
];


const categoryLinks = [
  { label: "Fashion", href: "/?category=Fashion" },
  { label: "Beauty", href: "/?category=Beauty" },
  { label: "Luxury", href: "/?category=Luxury" },
  { label: "Culture", href: "/?category=Culture" },
  { label: "Art & Design", href: "/?category=Art+%26+Design" },
  { label: "Entertainment", href: "/?category=Entertainment" },
];

const communityLinks = [
  { label: "Join Afrivogue", href: "/auth" },
  { label: "Membership", href: "/membership" },
  { label: "Submit an Article", href: "/submit" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const Footer = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email, source: "footer" });

    setLoading(false);

    if (error) {
      if (error.code === "23505") {
        toast({ title: "Already subscribed", description: "You're already on the list." });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
    } else {
      toast({ title: "Welcome to Afrivogue", description: "You're now on the insider list." });
    }

    localStorage.setItem("afrivogue_newsletter", "true");
    setEmail("");
  };

  const ColumnTitle = ({ children }: { children: React.ReactNode }) => (
    <h4 className="mb-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-gold">
      {children}
    </h4>
  );

  const ColumnLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
    <li>
      <Link to={to} className="font-body text-sm text-muted-foreground transition-colors hover:text-foreground">
        {children}
      </Link>
    </li>
  );

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-6 py-16 md:px-16 lg:px-24">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="font-display text-2xl font-bold text-foreground">
              AFRI<span className="text-gold">VOGUE</span>
            </Link>
            <p className="mt-4 font-body text-sm leading-relaxed text-muted-foreground">
              Curating culture, style, and tomorrow through a global Afrocentric lens.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-sm border border-border font-body text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-all hover:border-gold hover:text-gold"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <ColumnTitle>Explore</ColumnTitle>
            <ul className="space-y-2.5">
              {exploreLinks.map((l) => <ColumnLink key={l.label} to={l.href}>{l.label}</ColumnLink>)}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <ColumnTitle>Categories</ColumnTitle>
            <ul className="space-y-2.5">
              {categoryLinks.map((l) => <ColumnLink key={l.label} to={l.href}>{l.label}</ColumnLink>)}
            </ul>
          </div>

          {/* Community */}
          <div>
            <ColumnTitle>Community</ColumnTitle>
            <ul className="space-y-2.5">
              {communityLinks.map((l) => <ColumnLink key={l.label} to={l.href}>{l.label}</ColumnLink>)}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="sm:col-span-2 lg:col-span-1">
            <ColumnTitle>Newsletter</ColumnTitle>
            <p className="font-body text-sm text-muted-foreground">
              Trend reports & cultural forecasts — delivered weekly.
            </p>
            <form onSubmit={handleSubscribe} className="mt-4 flex flex-col gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full rounded-sm border border-border bg-background px-3 py-2 font-body text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-sm bg-primary px-4 py-2 font-body text-xs font-bold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "…" : "Subscribe"}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="font-body text-xs text-muted-foreground">
            © 2026 Afrivogue. All rights reserved.
          </p>
          <p className="font-body text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">
            Africa &amp; the Diaspora · Luxury · Culture · Foresight
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
