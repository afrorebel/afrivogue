import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut, Users, FileText, Crown, Gamepad2, ShoppingBag, BarChart3 } from "lucide-react";
import AdminTrends from "@/components/admin/AdminTrends";
import AdminForecasts from "@/components/admin/AdminForecasts";
import AdminSiteSettings from "@/components/admin/AdminSiteSettings";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminMoodboard from "@/components/admin/AdminMoodboard";
import AdminTrivia from "@/components/admin/AdminTrivia";
import AdminShop from "@/components/admin/AdminShop";
import AdminCRM from "@/components/admin/AdminCRM";

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
    <div className="min-h-screen bg-background">
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

      <main className="mx-auto max-w-6xl px-6 py-8">
        {stats && (
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
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

        <Tabs defaultValue="trends">
          <TabsList className="mb-6">
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="forecasts">Forecasts</TabsTrigger>
            <TabsTrigger value="trivia">Trivia</TabsTrigger>
            <TabsTrigger value="moodboard">Moodboard</TabsTrigger>
            <TabsTrigger value="shop">Shop</TabsTrigger>
            <TabsTrigger value="crm">CRM</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="site">Site Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="trends">
            <AdminTrends />
          </TabsContent>
          <TabsContent value="trivia">
            <AdminTrivia />
          </TabsContent>
          <TabsContent value="moodboard">
            <AdminMoodboard />
          </TabsContent>
          <TabsContent value="forecasts">
            <AdminForecasts />
          </TabsContent>
          <TabsContent value="shop">
            <AdminShop />
          </TabsContent>
          <TabsContent value="crm">
            <AdminCRM />
          </TabsContent>
          <TabsContent value="users">
            <AdminUsers />
          </TabsContent>
          <TabsContent value="site">
            <AdminSiteSettings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
