import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LogOut, User, BookOpen, Heart, Star, Award, DollarSign, Settings, PenSquare, Gamepad2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import ReferralWidget from "@/components/ReferralWidget";

const POINTS_TO_DOLLAR = 0.01; // 1 point = $0.01
const MIN_WITHDRAWAL = 50; // $50 minimum

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [points, setPoints] = useState<any>(null);
  const [savedArticles, setSavedArticles] = useState<any[]>([]);
  const [readingHistory, setReadingHistory] = useState<any[]>([]);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [subscribed, setSubscribed] = useState(false);
  const [subEnd, setSubEnd] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchDashboardData();
    checkSubscription();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    const [profileRes, pointsRes, savedRes, historyRes, prefsRes, withdrawRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("user_points").select("*").eq("user_id", user.id).single(),
      supabase.from("saved_articles").select("*, trends(headline, category, featured_image_url)").eq("user_id", user.id).order("saved_at", { ascending: false }).limit(20),
      supabase.from("reading_history").select("*, trends(headline, category, featured_image_url)").eq("user_id", user.id).order("read_at", { ascending: false }).limit(20),
      supabase.from("user_preferences").select("*").eq("user_id", user.id).single(),
      supabase.from("withdrawals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);

    if (profileRes.data) setProfile(profileRes.data);
    if (pointsRes.data) setPoints(pointsRes.data);
    if (savedRes.data) setSavedArticles(savedRes.data);
    if (historyRes.data) setReadingHistory(historyRes.data);
    if (prefsRes.data) setPreferences((prefsRes.data.categories as string[]) || []);
    if (withdrawRes.data) setWithdrawals(withdrawRes.data);
  };

  const checkSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (!error && data) {
        setSubscribed(data.subscribed);
        setSubEnd(data.subscription_end);
      }
    } catch (e) {
      console.log("Subscription check unavailable");
    }
  };

  const handleCheckout = async (plan: "monthly" | "yearly") => {
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

  const handleWithdrawal = async () => {
    if (!points || points.points * POINTS_TO_DOLLAR < MIN_WITHDRAWAL) {
      toast({ title: "Insufficient balance", description: `You need at least $${MIN_WITHDRAWAL} to withdraw.`, variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("withdrawals").insert({
      user_id: user!.id,
      points_amount: points.points,
      dollar_amount: points.points * POINTS_TO_DOLLAR,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Withdrawal requested", description: "Your withdrawal is pending admin approval." });
      fetchDashboardData();
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const pointsBalance = points?.points ?? 0;
  const dollarValue = (pointsBalance * POINTS_TO_DOLLAR).toFixed(2);
  const canWithdraw = parseFloat(dollarValue) >= MIN_WITHDRAWAL;

  const categories = ["Fashion", "Beauty", "Culture", "Lifestyle", "Art & Design", "Business of Fashion"];

  const togglePreference = async (cat: string) => {
    const updated = preferences.includes(cat)
      ? preferences.filter((c) => c !== cat)
      : [...preferences, cat];
    setPreferences(updated);
    await supabase.from("user_preferences").upsert({
      user_id: user.id,
      categories: updated,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 md:px-12">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link to="/" className="font-display text-xl font-bold text-foreground">
            AFRI<span className="text-gold">VOGUE</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/submit" className="font-body text-xs text-gold hover:text-gold/80 flex items-center gap-1">
              <PenSquare className="h-3 w-3" /> Submit Article
            </Link>
            <Link to={`/profile/${user.id}`} className="font-body text-xs text-muted-foreground hover:text-gold">
              Profile
            </Link>
            <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/"); }}>
              <LogOut className="mr-1 h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">
            Welcome, <span className="text-gold">{profile?.display_name || "Member"}</span>
          </h1>
          <p className="mt-1 font-body text-sm text-muted-foreground">Your Afrivogue Collective Dashboard</p>
        </motion.div>

        {/* Stats cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Points", value: pointsBalance.toLocaleString(), icon: Star, color: "text-gold" },
            { label: "Dollar Value", value: `$${dollarValue}`, icon: DollarSign, color: "text-gold" },
            { label: "Saved Articles", value: savedArticles.length, icon: Heart, color: "text-destructive" },
            { label: "Articles Read", value: readingHistory.length, icon: BookOpen, color: "text-primary" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-border bg-card p-4"
            >
              <stat.icon className={`mb-2 h-5 w-5 ${stat.color}`} />
              <p className="font-display text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="font-body text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="membership" className="space-y-6">
          <TabsList className="flex-wrap">
            <TabsTrigger value="membership">Membership</TabsTrigger>
            <TabsTrigger value="saved">Saved Articles</TabsTrigger>
            <TabsTrigger value="history">Reading History</TabsTrigger>
            <TabsTrigger value="points">Points & Earnings</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Membership Tab */}
          <TabsContent value="membership" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Monthly */}
              <div className={`rounded-lg border p-6 ${!subscribed ? "border-border" : "border-gold"}`}>
                <h3 className="font-display text-lg font-bold text-foreground">Monthly</h3>
                <p className="mt-1 font-display text-3xl font-bold text-gold">$1<span className="text-sm text-muted-foreground">/mo</span></p>
                <ul className="mt-4 space-y-2 font-body text-sm text-muted-foreground">
                  <li>✦ Access all premium editorials</li>
                  <li>✦ Save & bookmark articles</li>
                  <li>✦ Earn points on engagement</li>
                </ul>
                <Button onClick={() => handleCheckout("monthly")} className="mt-6 w-full bg-gold text-foreground hover:bg-gold/90" disabled={subscribed}>
                  {subscribed ? "Current Plan" : "Subscribe — $1/mo"}
                </Button>
              </div>
              {/* Yearly */}
              <div className="relative rounded-lg border-2 border-gold p-6">
                <Badge className="absolute -top-3 right-4 bg-gold text-foreground">Editor's Choice</Badge>
                <h3 className="font-display text-lg font-bold text-foreground">Annual</h3>
                <p className="mt-1 font-display text-3xl font-bold text-gold">$10<span className="text-sm text-muted-foreground">/yr</span></p>
                <ul className="mt-4 space-y-2 font-body text-sm text-muted-foreground">
                  <li>✦ Everything in Monthly</li>
                  <li>✦ 2 months free</li>
                  <li>✦ Priority article submissions</li>
                  <li>✦ Exclusive member badge</li>
                </ul>
                <Button onClick={() => handleCheckout("yearly")} className="mt-6 w-full bg-gold text-foreground hover:bg-gold/90" disabled={subscribed}>
                  {subscribed ? "Current Plan" : "Subscribe — $10/yr"}
                </Button>
              </div>
            </div>
            {subscribed && subEnd && (
              <p className="font-body text-sm text-muted-foreground">
                Your membership renews on {new Date(subEnd).toLocaleDateString()}.
              </p>
            )}
          </TabsContent>

          {/* Saved Articles Tab */}
          <TabsContent value="saved">
            {savedArticles.length === 0 ? (
              <p className="font-body text-sm text-muted-foreground">No saved articles yet. Browse our <Link to="/" className="text-gold hover:underline">latest trends</Link> to save some.</p>
            ) : (
              <div className="space-y-3">
                {savedArticles.map((item) => (
                  <Link key={item.id} to={`/trend/${item.trend_id}`} className="flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:border-gold/50">
                    {item.trends?.featured_image_url && (
                      <img src={item.trends.featured_image_url} alt="" className="h-12 w-12 rounded object-cover" />
                    )}
                    <div>
                      <p className="font-body text-sm font-medium text-foreground">{item.trends?.headline}</p>
                      <p className="font-body text-xs text-muted-foreground">{item.trends?.category}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Reading History Tab */}
          <TabsContent value="history">
            {readingHistory.length === 0 ? (
              <p className="font-body text-sm text-muted-foreground">No reading history yet.</p>
            ) : (
              <div className="space-y-3">
                {readingHistory.map((item) => (
                  <Link key={item.id} to={`/trend/${item.trend_id}`} className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:border-gold/50">
                    <div className="flex items-center gap-4">
                      {item.trends?.featured_image_url && (
                        <img src={item.trends.featured_image_url} alt="" className="h-12 w-12 rounded object-cover" />
                      )}
                      <div>
                        <p className="font-body text-sm font-medium text-foreground">{item.trends?.headline}</p>
                        <p className="font-body text-xs text-muted-foreground">{item.trends?.category}</p>
                      </div>
                    </div>
                    <p className="font-body text-xs text-muted-foreground">{new Date(item.read_at).toLocaleDateString()}</p>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Points & Earnings Tab */}
          <TabsContent value="points" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-border p-4">
                <p className="font-body text-xs text-muted-foreground">Total Points</p>
                <p className="font-display text-2xl font-bold text-gold">{pointsBalance.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="font-body text-xs text-muted-foreground">Estimated Value</p>
                <p className="font-display text-2xl font-bold text-foreground">${dollarValue}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="font-body text-xs text-muted-foreground">Withdrawal Eligibility</p>
                <p className={`font-display text-lg font-bold ${canWithdraw ? "text-green-500" : "text-muted-foreground"}`}>
                  {canWithdraw ? "Eligible" : `Need $${(MIN_WITHDRAWAL - parseFloat(dollarValue)).toFixed(2)} more`}
                </p>
              </div>
            </div>

            <Button onClick={handleWithdrawal} disabled={!canWithdraw} className="bg-gold text-foreground hover:bg-gold/90">
              <DollarSign className="mr-1 h-4 w-4" /> Request Withdrawal
            </Button>

            {withdrawals.length > 0 && (
              <div>
                <h3 className="mb-3 font-display text-lg font-bold text-foreground">Withdrawal History</h3>
                <div className="space-y-2">
                  {withdrawals.map((w) => (
                    <div key={w.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div>
                        <p className="font-body text-sm text-foreground">${w.dollar_amount}</p>
                        <p className="font-body text-xs text-muted-foreground">{new Date(w.created_at).toLocaleDateString()}</p>
                      </div>
                      <Badge variant={w.status === "approved" ? "default" : w.status === "rejected" ? "destructive" : "secondary"}>
                        {w.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-lg border border-border bg-card p-4">
              <h4 className="mb-2 font-display text-sm font-bold text-foreground">How to Earn Points</h4>
              <ul className="space-y-1 font-body text-xs text-muted-foreground">
                <li>📖 Read an article — 5 points</li>
                <li>💬 Comment on an article — 10 points</li>
                <li>👥 Refer a new member — 50 points</li>
                <li>📝 Get an article published — 200 points</li>
              </ul>
            </div>
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals">
            <ReferralWidget />
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <p className="mb-4 font-body text-sm text-muted-foreground">Select your preferred categories to personalize your feed.</p>
            <div className="flex flex-wrap gap-3">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => togglePreference(cat)}
                  className={`rounded-full border px-4 py-2 font-body text-sm transition-colors ${
                    preferences.includes(cat)
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-border text-muted-foreground hover:border-gold/50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="max-w-md space-y-4">
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground">Display Name</label>
                <Input
                  value={profile?.display_name || ""}
                  onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground">Bio</label>
                <textarea
                  value={profile?.bio || ""}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 font-body text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Tell us about yourself…"
                />
              </div>
              <Button
                onClick={async () => {
                  const { error } = await supabase.from("profiles").update({
                    display_name: profile?.display_name,
                    bio: profile?.bio,
                  }).eq("id", user.id);
                  if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
                  else toast({ title: "Profile updated" });
                }}
                className="bg-gold text-foreground hover:bg-gold/90"
              >
                <Settings className="mr-1 h-4 w-4" /> Save Changes
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
