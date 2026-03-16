import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Lock, Crown } from "lucide-react";
import { motion } from "framer-motion";

interface PaywallProps {
  previewContent?: string;
}

const Paywall = ({ previewContent }: PaywallProps) => {
  const { user } = useAuth();

  return (
    <div className="relative">
      {previewContent && (
        <div className="relative overflow-hidden">
          <p className="font-body text-base leading-relaxed text-muted-foreground">
            {previewContent.slice(0, 300)}…
          </p>
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 rounded-lg border-2 border-gold/30 bg-card p-8 text-center"
      >
        <Crown className="mx-auto mb-4 h-10 w-10 text-gold" />
        <h3 className="font-display text-xl font-bold text-foreground">
          Members Only Content
        </h3>
        <p className="mx-auto mt-2 max-w-md font-body text-sm text-muted-foreground">
          This premium editorial is exclusively available to Afrivogue Collective members.
          Join today to unlock the full experience.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link to="/membership">
            <Button className="bg-gold text-foreground hover:bg-gold/90">
              <Lock className="mr-2 h-4 w-4" /> Join the Collective
            </Button>
          </Link>
          {!user && (
            <Link to="/auth">
              <Button variant="outline" className="border-gold/30 text-gold hover:bg-gold/5">
                Sign In
              </Button>
            </Link>
          )}
        </div>
        <p className="mt-4 font-body text-xs text-muted-foreground">
          Starting at just <span className="text-gold">$1/month</span>
        </p>
      </motion.div>
    </div>
  );
};

export default Paywall;
