import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import AdminTrends from "@/components/admin/AdminTrends";
import AdminForecasts from "@/components/admin/AdminForecasts";
import AdminSiteSettings from "@/components/admin/AdminSiteSettings";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminMoodboard from "@/components/admin/AdminMoodboard";

const AdminDashboard = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();

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
        <Tabs defaultValue="trends">
          <TabsList className="mb-6">
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="forecasts">Forecasts</TabsTrigger>
            <TabsTrigger value="moodboard">Moodboard</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="site">Site Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="trends">
            <AdminTrends />
          </TabsContent>
          <TabsContent value="forecasts">
            <AdminForecasts />
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
