import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const NewsletterPopup = () => {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const trigger = useCallback(() => {
    setShow(true);
  }, []);

  useEffect(() => {
    // Don't show if already dismissed this session
    if (sessionStorage.getItem("afrivogue_newsletter_dismissed")) {
      setDismissed(true);
      return;
    }
    // Don't show if shown recently (12h cooldown)
    const lastShown = localStorage.getItem("afrivogue_newsletter_ts");
    const TWELVE_HOURS = 12 * 60 * 60 * 1000;
    if (lastShown && Date.now() - parseInt(lastShown, 10) < TWELVE_HOURS) {
      setDismissed(true);
      return;
    }

    let triggered = false;
    const fire = () => {
      if (triggered) return;
      triggered = true;
      trigger();
      cleanup();
    };

    // (a) 45-second timer
    const timer = setTimeout(fire, 45000);

    // (b) 60% scroll
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0 && scrollTop / docHeight >= 0.6) {
        fire();
      }
    };

    // (c) Exit intent — cursor moves to top of viewport
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        fire();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    const cleanup = () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };

    return cleanup;
  }, [trigger]);

  const handleClose = () => {
    setShow(false);
    setDismissed(true);
    sessionStorage.setItem("afrivogue_newsletter_dismissed", "1");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email, source: "popup" });

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

    localStorage.setItem("afrivogue_newsletter_ts", Date.now().toString());
    sessionStorage.setItem("afrivogue_newsletter_dismissed", "1");
    setShow(false);
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm px-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-lg border border-border bg-card"
          >
            <div className="h-1 w-full gradient-gold" />

            <button
              onClick={handleClose}
              className="absolute right-3 top-4 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="px-8 pb-8 pt-10 text-center">
              <p className="mb-2 font-body text-[10px] font-bold uppercase tracking-[0.3em] text-gold">
                Exclusive Access
              </p>
              <h3 className="font-display text-2xl font-bold text-foreground">
                Stay Ahead of the Curve
              </h3>
              <p className="mt-3 font-body text-sm text-muted-foreground">
                Join the Afrivogue insider list for curated trend reports, cultural forecasts, and editorial exclusives — delivered weekly.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full rounded-sm border border-border bg-background px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-sm bg-gold px-4 py-3 font-body text-sm font-bold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? "Subscribing…" : "Get Insider Access"}
                </button>
              </form>

              <p className="mt-4 font-body text-[10px] text-muted-foreground/60">
                No spam. Unsubscribe anytime. We respect your inbox.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NewsletterPopup;
