import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
import { TrendingUp, Eye, FileText, Users, ShoppingBag, MessageSquare } from "lucide-react";

const COLORS = ["hsl(var(--primary))", "hsl(var(--gold, 43 74% 58%))", "hsl(var(--muted-foreground))", "#8884d8", "#82ca9d", "#ffc658"];

const AdminAnalytics = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const [
        trendsRes,
        editorialsRes,
        submissionsRes,
        usersRes,
        ordersRes,
        commentsRes,
        triviaRes,
        moodboardRes,
        newsletterRes,
      ] = await Promise.all([
        supabase.from("trends").select("category, content_tier, created_at, published"),
        supabase.from("trends").select("category, created_at").eq("published", true).gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()),
        supabase.from("article_submissions").select("status, created_at, category"),
        supabase.from("profiles").select("created_at"),
        supabase.from("orders").select("total, status, created_at"),
        supabase.from("comments").select("created_at"),
        supabase.from("trivia_scores").select("score, total_questions, created_at"),
        supabase.from("moodboard_items").select("approved, needs_review, created_at"),
        supabase.from("newsletter_subscribers").select("subscribed_at"),
      ]);

      return {
        trends: trendsRes.data || [],
        recentTrends: editorialsRes.data || [],
        submissions: submissionsRes.data || [],
        users: usersRes.data || [],
        orders: ordersRes.data || [],
        comments: commentsRes.data || [],
        trivia: triviaRes.data || [],
        moodboard: moodboardRes.data || [],
        newsletter: newsletterRes.data || [],
      };
    },
  });

  if (isLoading || !stats) return <p className="text-muted-foreground">Loading analytics…</p>;

  // Category distribution
  const catMap: Record<string, number> = {};
  stats.trends.forEach((t: any) => { catMap[t.category] = (catMap[t.category] || 0) + 1; });
  const categoryData = Object.entries(catMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Content published per week (last 30 days)
  const weekMap: Record<string, number> = {};
  stats.recentTrends.forEach((t: any) => {
    const d = new Date(t.created_at);
    const week = `W${Math.ceil(d.getDate() / 7)}`;
    weekMap[week] = (weekMap[week] || 0) + 1;
  });
  const weeklyData = Object.entries(weekMap).map(([name, count]) => ({ name, count }));

  // Submissions by status
  const statusMap: Record<string, number> = {};
  stats.submissions.forEach((s: any) => { statusMap[s.status] = (statusMap[s.status] || 0) + 1; });
  const submissionData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

  // User growth (last 6 months)
  const monthMap: Record<string, number> = {};
  stats.users.forEach((u: any) => {
    const d = new Date(u.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap[key] = (monthMap[key] || 0) + 1;
  });
  const userGrowth = Object.entries(monthMap).sort().slice(-6).map(([month, users]) => ({ month, users }));

  // Revenue from orders
  const totalRevenue = stats.orders.filter((o: any) => o.status !== "cancelled").reduce((s: number, o: any) => s + Number(o.total || 0), 0);
  const totalPublished = stats.trends.filter((t: any) => t.published).length;
  const pendingSubs = stats.submissions.filter((s: any) => s.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Published Content", value: totalPublished, icon: FileText, color: "text-gold" },
          { label: "Total Users", value: stats.users.length, icon: Users, color: "text-gold" },
          { label: "Pending Submissions", value: pendingSubs, icon: TrendingUp, color: "text-foreground" },
          { label: "Revenue", value: `$${totalRevenue.toFixed(0)}`, icon: ShoppingBag, color: "text-gold" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <div>
                <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">{kpi.label}</p>
                <p className={`font-display text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Engagement row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">Comments</p>
              <p className="font-display text-xl font-bold text-foreground">{stats.comments.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <Eye className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">Newsletter Subs</p>
              <p className="font-display text-xl font-bold text-foreground">{stats.newsletter.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">Moodboard Items</p>
              <p className="font-display text-xl font-bold text-foreground">
                {stats.moodboard.filter((m: any) => m.approved).length} / {stats.moodboard.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category distribution */}
        <Card>
          <CardHeader><CardTitle className="font-display text-base">Content by Category</CardTitle></CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={categoryData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Submission status pie */}
        <Card>
          <CardHeader><CardTitle className="font-display text-base">Submission Status</CardTitle></CardHeader>
          <CardContent>
            {submissionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={submissionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                    {submissionData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No submissions yet</p>
            )}
          </CardContent>
        </Card>

        {/* User growth */}
        <Card>
          <CardHeader><CardTitle className="font-display text-base">User Growth (Monthly)</CardTitle></CardHeader>
          <CardContent>
            {userGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Weekly publish rate */}
        <Card>
          <CardHeader><CardTitle className="font-display text-base">Published This Month (Weekly)</CardTitle></CardHeader>
          <CardContent>
            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={weeklyData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--gold, 43 74% 58%))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No data this month</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;
