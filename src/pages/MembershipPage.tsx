import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageMasthead from "@/components/editorial/PageMasthead";
import { motion } from "framer-motion";
import { Crown, BookOpen, Star, Users } from "lucide-react";

interface MembershipSettings {
  pricing_enabled: boolean;
  monthly_price: string;
  yearly_price: string;
  monthly_label: string;
  yearly_label: string;
}

const DEFAULT_MEMBERSHIP: MembershipSettings = {
  pricing_enabled: false,
  monthly_price: "1",
  yearly_price: "10",
  monthly_label: "Monthly",
  yearly_label: "Annual",
};

const MembershipPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [joinEmail, setJoinEmail] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);

  const { data: membership = DEFAULT_MEMBERSHIP } = useQuery({
    queryKey: ["membership-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "membership")
        .maybeSingle();
      if (data?.value) return { ...DEFAULT_MEMBERSHIP, ...(data.value as unknown as MembershipSettings) };
      return DEFAULT_MEMBERSHIP;
    },
  });

  const handleFreeSignup = () => {
    if (user) {
      toast({ title: "You're already a member!" });
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  const handleFoundingJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinEmail) return;
    setJoinLoading(true);
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: joinEmail, source: "founding-member" });
    setJoinLoading(false);
    if (error && error.code !== "23505") {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setJoinSuccess(true);
  };

  const handleCheckout = async (plan: "monthly" | "yearly") => {
    if (!user) {
      navigate("/auth");
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { plan },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const pricingEnabled = membership.pricing_enabled;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PageMasthead
        eyebrow="Membership"
        title="Join the"
        accent="Collective"
        intro="Go deeper into the culture. Premium editorials, early forecasts, paid publishing and a community that truly gets it."
        meta="Founding Phase"
      />
      <main className="mx-auto max-w-5xl px-6 pb-24 pt-4">
        <p className="mx-auto max-w-xl text-center font-body text-[10px] uppercase leading-relaxed tracking-[0.25em] text-gold/80">
          Founding members join free while we build, and keep their founding perks for good. Your voice shapes AfriVogue from day one.
        </p>

        {/* Features */}
        <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4">
          {[
            { icon: Crown, title: "Premium editorials", desc: "Every long read and member-only feature, beautifully told" },
            { icon: Star, title: "Earn as you engage", desc: "Collect points for reading, sharing and contributing" },
            { icon: BookOpen, title: "Get published, get paid", desc: "Pitch your story. Approved pieces are paid and credited" },
            { icon: Users, title: "Find your people", desc: "Creatives and culture lovers across the world" },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <f.icon className="mx-auto mb-4 h-6 w-6 text-gold" />
              <h3 className="font-display text-lg italic text-foreground">{f.title}</h3>
              <p className="mt-1 font-body text-xs text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Free Membership Mode */}
        {!pricingEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-16 mx-auto max-w-lg rounded-3xl border border-gold/40 bg-sunset p-8 text-center shadow-soft md:p-10"
          >
            <Crown className="mx-auto mb-4 h-12 w-12 text-gold" />
            <h3 className="font-display text-3xl italic text-foreground">Become a founding member</h3>
            <p className="mt-3 font-body text-sm text-muted-foreground">
              Everything members get, free while we build. Join now and your founding status, and the perks that come with it, stay yours when paid membership opens.
            </p>
            <ul className="mt-6 space-y-3 font-body text-sm text-muted-foreground text-left max-w-xs mx-auto">
              <li>✦ Every premium editorial and long read</li>
              <li>✦ Early access to cultural forecasts</li>
              <li>✦ Save stories to your personal library</li>
              <li>✦ Earn points as you read and share</li>
              <li>✦ Pitch and publish your own stories</li>
              <li>✦ Member-only conversations and drops</li>
            </ul>

            {user ? (
              <Button onClick={handleFreeSignup} className="mt-8 w-full bg-gold text-primary-foreground hover:bg-gold/90">
                Go to Dashboard
              </Button>
            ) : joinSuccess ? (
              <div className="mt-8 rounded-2xl border border-gold/30 bg-gold/10 p-5">
                <p className="font-display text-2xl italic text-gold">Welcome to the Collective.</p>
                <p className="mt-2 font-body text-sm text-muted-foreground">
                  You are officially a founding member. Check your inbox for your welcome letter and next steps.
                </p>
                <Button asChild className="mt-4 bg-gold text-primary-foreground hover:bg-gold/90">
                  <Link to="/auth">Create Your Account</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleFoundingJoin} className="mt-8 flex flex-col gap-3">
                <input
                  type="email"
                  value={joinEmail}
                  onChange={(e) => setJoinEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full rounded-full border border-border bg-background px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                />
                <Button type="submit" disabled={joinLoading} className="w-full bg-gold text-primary-foreground hover:bg-gold/90">
                  {joinLoading ? "Saving your spot…" : "Claim my founding spot"}
                </Button>
              </form>
            )}
          </motion.div>
        )}

        {/* Paid Plans */}
        {pricingEnabled && (
          <div className="mt-16 grid gap-6 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-lg border border-border p-8"
            >
              <h3 className="font-display text-xl font-bold text-foreground">{membership.monthly_label}</h3>
              <p className="mt-2 font-display text-4xl font-bold text-gold">
                ${membership.monthly_price}<span className="text-base text-muted-foreground">/month</span>
              </p>
              <ul className="mt-6 space-y-3 font-body text-sm text-muted-foreground">
                <li>✦ All premium editorials</li>
                <li>✦ Save & bookmark articles</li>
                <li>✦ Earn engagement points</li>
                <li>✦ Personal dashboard</li>
              </ul>
              <Button onClick={() => handleCheckout("monthly")} className="mt-8 w-full bg-gold text-primary-foreground hover:bg-gold/90">
                Get Started — ${membership.monthly_price}/mo
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative rounded-3xl border border-gold/40 bg-sunset p-8 shadow-soft"
            >
              <Badge className="absolute -top-3 right-4 bg-gold text-primary-foreground">Editor's Choice</Badge>
              <h3 className="font-display text-xl font-bold text-foreground">{membership.yearly_label}</h3>
              <p className="mt-2 font-display text-4xl font-bold text-gold">
                ${membership.yearly_price}<span className="text-base text-muted-foreground">/year</span>
              </p>
              <ul className="mt-6 space-y-3 font-body text-sm text-muted-foreground">
                <li>✦ Everything in {membership.monthly_label}</li>
                <li>✦ Best value — save more</li>
                <li>✦ Priority article submissions</li>
                <li>✦ Exclusive member badge</li>
                <li>✦ Early access to forecasts</li>
              </ul>
              <Button onClick={() => handleCheckout("yearly")} className="mt-8 w-full bg-gold text-primary-foreground hover:bg-gold/90">
                Get Started — ${membership.yearly_price}/yr
              </Button>
            </motion.div>
          </div>
        )}

        {!user && !joinSuccess && (
          <p className="mt-8 text-center font-body text-sm text-muted-foreground">
            Already a member?{" "}
            <Link to="/auth" className="text-gold hover:underline">Sign in</Link>
          </p>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MembershipPage;
