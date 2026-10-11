import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { api } from "@/integrations/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import Wordmark from "@/components/brand/Wordmark";
import heroImage from "@/assets/hero-fashion.jpg";

type Mode = "login" | "signup" | "forgot" | "reset";

const COPY: Record<Mode, { title: string; sub: string; cta: string }> = {
  login: { title: "Welcome back", sub: "Sign in to your AfriVogue account", cta: "Sign in" },
  signup: { title: "Join the Collective", sub: "Free to join. Your stories, moodboards and streaks, saved.", cta: "Create my account" },
  forgot: { title: "Forgot your password?", sub: "Enter your email and we'll send you a link to choose a new one.", cta: "Send reset link" },
  reset: { title: "Choose a new password", sub: "At least 8 characters. Then you're straight back in.", cta: "Save and sign in" },
};

const AuthPage = () => {
  const [params] = useSearchParams();
  const resetToken = params.get("reset");
  const [mode, setMode] = useState<Mode>(resetToken ? "reset" : params.get("mode") === "signup" ? "signup" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const isLogin = mode === "login";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await api.auth.signInWithPassword({ email, password });
        if (error) toast({ title: "Couldn't sign you in", description: error.message, variant: "destructive" });
        else {
          toast({ title: "Welcome back" });
          navigate("/dashboard");
        }
      } else if (mode === "signup") {
        const { error } = await api.auth.signUp({ email, password, options: { data: { display_name: displayName } } });
        if (error) toast({ title: "Couldn't create your account", description: error.message, variant: "destructive" });
        else {
          toast({ title: "Welcome to the Collective", description: "We've sent a welcome note to your inbox." });
          navigate("/dashboard");
        }
      } else if (mode === "forgot") {
        const { error } = await api.auth.resetPasswordForEmail(email);
        if (error) toast({ title: "Couldn't send the email", description: error.message, variant: "destructive" });
        else {
          toast({ title: "Check your inbox", description: "If there's an account for that email, a reset link is on its way." });
          setMode("login");
        }
      } else if (resetToken) {
        const { error } = await api.auth.resetPassword(resetToken, password);
        if (error) toast({ title: "Couldn't reset your password", description: error.message, variant: "destructive" });
        else {
          toast({ title: "Password updated", description: "You're signed in." });
          navigate("/dashboard");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left panel - branding */}
      <div className="hidden w-1/2 p-4 lg:block">
        <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl p-12">
          <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/30" />
          <Link to="/" aria-label="Afrivogue home" className="relative">
            <Wordmark tone="light" className="text-4xl" />
          </Link>
          <div className="relative">
            <h2 className="font-display text-5xl italic leading-[1.02] text-white">
              Join the <Wordmark tone="light" /> Collective
            </h2>
            <p className="mt-5 max-w-md font-body text-base leading-relaxed text-white/75">
              Read deeper, see what is coming first and help shape the stories the world tells about African style. Founding members join free.
            </p>
          </div>
          <p className="relative font-body text-xs text-white/50">© {new Date().getFullYear()} Afrivogue. All rights reserved.</p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center lg:text-left">
            <Link to="/" aria-label="Afrivogue home" className="lg:hidden">
              <Wordmark className="text-3xl" />
            </Link>
            <h1 className="mt-4 font-display text-4xl italic text-foreground">{COPY[mode].title}</h1>
            <p className="mt-1 font-body text-sm text-muted-foreground">{COPY[mode].sub}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="displayName" className="font-body text-xs uppercase tracking-wider text-muted-foreground">
                  Display Name
                </Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="border-border/50 bg-background"
                />
              </div>
            )}
            {mode !== "reset" && (
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
                autoComplete="email"
                className="border-border/50 bg-background"
              />
            </div>
            )}
            {mode !== "forgot" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="font-body text-xs uppercase tracking-wider text-muted-foreground">
                  {mode === "reset" ? "New password" : "Password"}
                </Label>
                {isLogin && (
                  <button type="button" onClick={() => setMode("forgot")} className="font-body text-xs text-muted-foreground hover:text-foreground hover:underline">
                    Forgot password?
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={isLogin ? 1 : 8}
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="border-border/50 bg-background"
              />
            </div>
            )}
            <Button type="submit" className="w-full bg-gold text-foreground hover:bg-gold/90" disabled={loading}>
              {loading ? "Please wait…" : COPY[mode].cta}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setMode(isLogin ? "signup" : "login")}
              className="font-body text-sm text-gold hover:underline"
            >
              {isLogin ? "New here? Join the Collective, it's free" : "Already have an account? Sign in"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
