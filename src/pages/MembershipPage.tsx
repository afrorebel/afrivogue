import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { Crown, BookOpen, Star, Users } from "lucide-react";

const MembershipPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 pb-20 pt-28">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">
            Join the <span className="text-gold">Afrivogue Collective</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-body text-lg text-muted-foreground">
            Unlock premium editorials, earn from your contributions, and join a global community of culture shapers.
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

        {/* Plans */}
        <div className="mt-16 grid gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-lg border border-border p-8"
          >
            <h3 className="font-display text-xl font-bold text-foreground">Monthly</h3>
            <p className="mt-2 font-display text-4xl font-bold text-gold">$1<span className="text-base text-muted-foreground">/month</span></p>
            <ul className="mt-6 space-y-3 font-body text-sm text-muted-foreground">
              <li>✦ All premium editorials</li>
              <li>✦ Save & bookmark articles</li>
              <li>✦ Earn engagement points</li>
              <li>✦ Personal dashboard</li>
            </ul>
            <Button onClick={() => handleCheckout("monthly")} className="mt-8 w-full bg-gold text-foreground hover:bg-gold/90">
              Get Started — $1/mo
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative rounded-lg border-2 border-gold p-8"
          >
            <Badge className="absolute -top-3 right-4 bg-gold text-foreground">Editor's Choice</Badge>
            <h3 className="font-display text-xl font-bold text-foreground">Annual</h3>
            <p className="mt-2 font-display text-4xl font-bold text-gold">$10<span className="text-base text-muted-foreground">/year</span></p>
            <ul className="mt-6 space-y-3 font-body text-sm text-muted-foreground">
              <li>✦ Everything in Monthly</li>
              <li>✦ Save 2 months — best value</li>
              <li>✦ Priority article submissions</li>
              <li>✦ Exclusive member badge</li>
              <li>✦ Early access to forecasts</li>
            </ul>
            <Button onClick={() => handleCheckout("yearly")} className="mt-8 w-full bg-gold text-foreground hover:bg-gold/90">
              Get Started — $10/yr
            </Button>
          </motion.div>
        </div>

        {!user && (
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
