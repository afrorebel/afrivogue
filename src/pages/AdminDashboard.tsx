import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut, Users, FileText, Crown, Gamepad2, ShoppingBag, BarChart3, Package, Target, Newspaper, FolderTree, Shield, LineChart, Code, Megaphone, Mail } from "lucide-react";
import AdminTrends from "@/components/admin/AdminTrends";
import AdminForecasts from "@/components/admin/AdminForecasts";
import AdminSiteSettings from "@/components/admin/AdminSiteSettings";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminMoodboard from "@/components/admin/AdminMoodboard";
import AdminTrivia from "@/components/admin/AdminTrivia";
import AdminShop from "@/components/admin/AdminShop";
import AdminCRM from "@/components/admin/AdminCRM";
import AdminBundlesCrossSell from "@/components/admin/AdminBundlesCrossSell";
import AdminSegmentation from "@/components/admin/AdminSegmentation";
import AdminEditorials from "@/components/admin/AdminEditorials";
import AdminCategories from "@/components/admin/AdminCategories";
import AdminRoles from "@/components/admin/AdminRoles";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import AdminCodeInjection from "@/components/admin/AdminCodeInjection";
import AdminMarketingIntegrations from "@/components/admin/AdminMarketingIntegrations";

const AdminDashboard = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [profilesRes, trendsRes, triviaRes, premiumRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("trends").select("id", { count: "exact", head: true }).eq("published", true),
        supabase.from("trivia_questions").select("id", { count: "exact", head: true }).eq("published", true),
        supabase.from("site_settings").select("value").eq("key", "manual_premium_users").maybeSingle(),
      ]);
      return {
        users: profilesRes.count ?? 0,
        articles: trendsRes.count ?? 0,
        trivia: triviaRes.count ?? 0,
        premium: ((premiumRes.data?.value as string[]) || []).length,
      };
    },
    enabled: !!user && isAdmin,
  });

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/admin/login");
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 py-4 md:px-12">
        <div className="font-display text-xl font-bold text-foreground">
          AFRI<span className="text-gold">VOGUE</span>
          <span className="ml-3 font-body text-xs font-normal uppercase tracking-[0.15em] text-muted-foreground">Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-body text-xs text-muted-foreground">{user.email}</span>
          <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/"); }}>
            <LogOut className="mr-1 h-4 w-4" /> Sign out
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Vertical sidebar nav */}
        <Tabs defaultValue="analytics" orientation="vertical" className="flex flex-1">
          <TabsList className="flex flex-col items-stretch h-auto w-52 shrink-0 border-r border-border bg-card rounded-none p-2 gap-0.5 justify-start overflow-y-auto">
            {[
              { value: "analytics", label: "Analytics", icon: BarChart3 },
              { value: "trends", label: "Trends", icon: FileText },
              { value: "editorials", label: "Editorials", icon: Newspaper },
              { value: "forecasts", label: "Forecasts", icon: LineChart },
              { value: "trivia", label: "Trivia", icon: Gamepad2 },
              { value: "moodboard", label: "Moodboard", icon: FolderTree },
              { value: "shop", label: "Shop", icon: ShoppingBag },
              { value: "bundles", label: "Bundles", icon: Package },
              { value: "crm", label: "CRM", icon: Target },
              { value: "segments", label: "Segments", icon: Users },
              { value: "categories", label: "Categories", icon: FolderTree },
              { value: "roles", label: "Roles", icon: Shield },
              { value: "users", label: "Users", icon: Users },
              { value: "marketing", label: "Marketing", icon: Megaphone },
              { value: "code", label: "Code Inject", icon: Code },
              { value: "site", label: "Settings", icon: Crown },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="justify-start gap-2 px-3 py-2.5 font-body text-xs uppercase tracking-wider data-[state=active]:bg-muted data-[state=active]:text-foreground rounded-md"
              >
                <tab.icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex-1 overflow-y-auto p-6">
            {stats && (
              <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  { label: "Total Users", value: stats.users, icon: Users, color: "text-gold" },
                  { label: "Premium Members", value: stats.premium, icon: Crown, color: "text-gold" },
                  { label: "Published Articles", value: stats.articles, icon: FileText, color: "text-foreground" },
                  { label: "Trivia Questions", value: stats.trivia, icon: Gamepad2, color: "text-foreground" },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center gap-2">
                      <s.icon className={`h-4 w-4 ${s.color}`} />
                      <span className="font-body text-xs uppercase tracking-wider text-muted-foreground">{s.label}</span>
                    </div>
                    <p className={`mt-2 font-display text-2xl font-bold ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>
            )}

            <TabsContent value="analytics" className="mt-0"><AdminAnalytics /></TabsContent>
            <TabsContent value="trends" className="mt-0"><AdminTrends /></TabsContent>
            <TabsContent value="editorials" className="mt-0"><AdminEditorials /></TabsContent>
            <TabsContent value="trivia" className="mt-0"><AdminTrivia /></TabsContent>
            <TabsContent value="moodboard" className="mt-0"><AdminMoodboard /></TabsContent>
            <TabsContent value="forecasts" className="mt-0"><AdminForecasts /></TabsContent>
            <TabsContent value="shop" className="mt-0"><AdminShop /></TabsContent>
            <TabsContent value="bundles" className="mt-0"><AdminBundlesCrossSell /></TabsContent>
            <TabsContent value="crm" className="mt-0"><AdminCRM /></TabsContent>
            <TabsContent value="segments" className="mt-0"><AdminSegmentation /></TabsContent>
            <TabsContent value="categories" className="mt-0"><AdminCategories /></TabsContent>
            <TabsContent value="roles" className="mt-0"><AdminRoles /></TabsContent>
            <TabsContent value="users" className="mt-0"><AdminUsers /></TabsContent>
            <TabsContent value="site" className="mt-0"><AdminSiteSettings /></TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
