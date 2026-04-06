import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
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
        .eq("setting_key", "membership")
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
      <main className="mx-auto max-w-5xl px-6 pb-20 pt-28">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">
            Join the <span className="text-gold">Afrivogue Collective</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-body text-lg text-muted-foreground">
            Get full access to Afrivogue's platform — premium editorials, cultural forecasts, community features, and exclusive content from a global Afrocentric lens.
          </p>
          <p className="mx-auto mt-3 max-w-xl font-body text-sm text-gold/80">
            We're in our founding phase. Early members are helping shape what Afrivogue becomes — your voice matters from day one.
          </p>
        </motion.div>

        {/* Features */}
        <div className="mt-16 grid gap-8 md:grid-cols-4">
          {[
            { icon: Crown, title: "Premium Content", desc: "Access exclusive editorials and long-form features" },
            { icon: Star, title: "Earn Points", desc: "Get rewarded for reading, sharing, and contributing" },
            { icon: BookOpen, title: "Publish Articles", desc: "Submit your own editorials and earn from approved pieces" },
            { icon: Users, title: "Community", desc: "Connect with fashion and culture enthusiasts worldwide" },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <f.icon className="mx-auto mb-3 h-8 w-8 text-gold" />
              <h3 className="font-display text-sm font-bold text-foreground">{f.title}</h3>
              <p className="mt-1 font-body text-xs text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Free Membership Mode */}
        {!pricingEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-16 mx-auto max-w-lg rounded-lg border-2 border-gold p-10 text-center"
          >
            <Crown className="mx-auto mb-4 h-12 w-12 text-gold" />
            <h3 className="font-display text-2xl font-bold text-foreground">Become a Founding Member</h3>
            <p className="mt-3 font-body text-sm text-muted-foreground">
              Join the Afrivogue Collective as a founding member. Get full access to our platform, community, and exclusive content — completely free during our founding phase.
            </p>
            <ul className="mt-6 space-y-3 font-body text-sm text-muted-foreground text-left max-w-xs mx-auto">
              <li>✦ All premium editorials</li>
              <li>✦ Save & bookmark articles</li>
              <li>✦ Earn engagement points</li>
              <li>✦ Personal dashboard</li>
              <li>✦ Submit your own articles</li>
              <li>✦ Community access</li>
            </ul>

            {user ? (
              <Button onClick={handleFreeSignup} className="mt-8 w-full bg-gold text-primary-foreground hover:bg-gold/90">
                Go to Dashboard
              </Button>
            ) : joinSuccess ? (
              <div className="mt-8 rounded-md border border-gold/30 bg-gold/10 p-5">
                <p className="font-display text-lg font-bold text-gold">Welcome, Founding Member ✦</p>
                <p className="mt-2 font-body text-sm text-muted-foreground">
                  You're officially part of the Afrivogue Collective. Check your inbox for next steps.
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
                  className="w-full rounded-sm border border-border bg-background px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                />
                <Button type="submit" disabled={joinLoading} className="w-full bg-gold text-primary-foreground hover:bg-gold/90">
                  {joinLoading ? "Joining…" : "Join as Founding Member"}
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
              className="relative rounded-lg border-2 border-gold p-8"
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
    </div>
  );
};

export default MembershipPage;
