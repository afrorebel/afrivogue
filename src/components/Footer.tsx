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

const quickLinks = [
  { label: "Trends", href: "/" },
  { label: "Editorials", href: "/editorials" },
  { label: "Forecast", href: "/forecast" },
  { label: "Moodboard", href: "/moodboard" },
  { label: "Trivia", href: "/trivia" },
  { label: "About", href: "/about" },
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

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-6 py-16 md:px-16 lg:px-24">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="font-display text-2xl font-bold text-foreground">
              AFRI<span className="text-gold">VOGUE</span>
            </Link>
            <p className="mt-4 font-body text-sm leading-relaxed text-muted-foreground">
              Curating culture, style, and tomorrow through a global Afrocentric lens.
            </p>
            <div className="mt-6 flex items-center gap-4">
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

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-gold">
              Explore
            </h4>
            <ul className="space-y-2.5">
              {quickLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.href}
                    className="font-body text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="mb-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-gold">
              Community
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/auth" className="font-body text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Join Afrivogue
                </Link>
              </li>
              <li>
                <Link to="/membership" className="font-body text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Membership
                </Link>
              </li>
              <li>
                <Link to="/submit" className="font-body text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Submit an Article
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="mb-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-gold">
              Newsletter
            </h4>
            <p className="font-body text-sm text-muted-foreground">
              Trend reports & cultural forecasts — delivered weekly.
            </p>
            <form onSubmit={handleSubscribe} className="mt-4 flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 rounded-sm border border-border bg-background px-3 py-2 font-body text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-sm bg-primary px-4 py-2 font-body text-xs font-bold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "…" : "Go"}
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
