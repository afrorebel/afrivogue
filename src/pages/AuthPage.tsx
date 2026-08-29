import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "Login failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Welcome back" });
        navigate("/dashboard");
      }
    } else {
      const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
          emailRedirectTo: "https://afrivogue.com",
        },
      });
      if (error) {
        toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      } else {
        // Send welcome email
        if (signUpData.user?.email) {
          supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "welcome",
              recipientEmail: signUpData.user.email,
              idempotencyKey: `welcome-${signUpData.user.id}`,
              templateData: { name: displayName || undefined },
            },
          }).catch(() => {}); // fire-and-forget
        }
        toast({
          title: "Check your email",
          description: "We sent you a confirmation link to verify your account.",
        });
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left panel - branding */}
      <div className="hidden w-1/2 flex-col justify-between bg-foreground p-12 lg:flex">
        <Link to="/" className="font-display text-3xl font-bold text-background">
          AFRI<span className="text-gold">VOGUE</span>
        </Link>
        <div>
          <h2 className="font-display text-4xl font-bold leading-tight text-background">
            Join the<br />
            <span className="text-gold">Afrivogue Collective</span>
          </h2>
          <p className="mt-4 max-w-md font-body text-sm leading-relaxed text-background/60">
            Unlock premium editorials, earn points for your contributions, and become part of a global community shaping the narrative of African fashion and culture.
          </p>
        </div>
        <p className="font-body text-xs text-background/40">
          © {new Date().getFullYear()} Afrivogue. All rights reserved.
        </p>
      </div>

      {/* Right panel - form */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center lg:text-left">
            <Link to="/" className="font-display text-2xl font-bold text-foreground lg:hidden">
              AFRI<span className="text-gold">VOGUE</span>
            </Link>
            <h1 className="mt-4 font-display text-2xl font-bold text-foreground">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="mt-1 font-body text-sm text-muted-foreground">
              {isLogin
                ? "Sign in to your Afrivogue account"
                : "Join the Afrivogue Collective today"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="displayName" className="font-body text-xs uppercase tracking-wider text-muted-foreground">
                  Display Name
                </Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  required={!isLogin}
                  className="border-border/50 bg-background"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="font-body text-xs uppercase tracking-wider text-muted-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="border-border/50 bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="font-body text-xs uppercase tracking-wider text-muted-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="border-border/50 bg-background"
              />
            </div>
            <Button type="submit" className="w-full bg-gold text-foreground hover:bg-gold/90" disabled={loading}>
              {loading ? "Please wait…" : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="font-body text-sm text-gold hover:underline"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
