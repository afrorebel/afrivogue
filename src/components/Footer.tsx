import { useState } from "react";
import { Link } from "react-router-dom";
import Wordmark from "@/components/brand/Wordmark";
import SocialIcon from "@/components/brand/SocialIcons";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/afrivoguemagazine" },
  { label: "TikTok", href: "https://tiktok.com/@afrivogue" },
  { label: "X", href: "https://x.com/afrivogueonline" },
  { label: "Pinterest", href: "https://pinterest.com/afrivogue" },
  { label: "YouTube", href: "https://youtube.com/@afrivogue" },
];

const exploreLinks = [
  { label: "Stories", href: "/trends" },
  { label: "Editorials", href: "/editorials" },
  { label: "Forecast", href: "/forecast" },
  { label: "Moodboard", href: "/moodboard" },
];


const categoryLinks = [
  { label: "Fashion", href: "/trends?category=Fashion" },
  { label: "Beauty", href: "/trends?category=Beauty" },
  { label: "Luxury", href: "/trends?category=Luxury" },
  { label: "Culture", href: "/trends?category=Culture" },
  { label: "Art & Design", href: "/trends?category=Art+%26+Design" },
  { label: "Entertainment", href: "/trends?category=Entertainment" },
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
    <h4 className="mb-4 font-display text-xl italic text-gold">
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
    <footer className="mt-8 rounded-t-[2.5rem] border-t border-border/60 bg-card px-4 md:px-8 lg:px-12">
      <div className="mx-auto max-w-[1440px] py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" aria-label="Afrivogue home">
              <Wordmark className="text-3xl" />
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
                  aria-label={`Afrivogue on ${s.label}`}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/60 text-foreground/70 transition-all hover:-translate-y-0.5 hover:border-gold hover:bg-gold hover:text-primary-foreground"
                >
                  <SocialIcon name={s.label} />
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
                className="w-full rounded-full border border-border bg-background px-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-primary px-4 py-2.5 font-body text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-50"
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
