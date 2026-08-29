import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { ShoppingCart, Star, Mail, Users, AlertTriangle, Clock } from "lucide-react";

const AdminCRM = () => {
  const qc = useQueryClient();

  // Abandoned carts: cart_items older than 1 hour with no order
  const { data: abandonedCarts = [] } = useQuery({
    queryKey: ["admin-abandoned-carts"],
    queryFn: async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("cart_items")
        .select("*, product:products(name, price, images)")
        .lt("created_at", oneHourAgo)
        .is("reminder_sent_at", null)
        .order("created_at", { ascending: false });
      // Group by user_id
      const grouped: Record<string, any[]> = {};
      (data || []).forEach((item: any) => {
        if (!grouped[item.user_id]) grouped[item.user_id] = [];
        grouped[item.user_id].push(item);
      });
      return Object.entries(grouped).map(([userId, items]) => ({
        userId,
        items,
        total: items.reduce((a: number, i: any) => a + (i.product?.price || 0) * i.quantity, 0),
        oldestItem: items[items.length - 1]?.created_at,
      }));
    },
  });

  // Product reviews for moderation
  const { data: reviews = [] } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_reviews")
        .select("*, product:products(name)")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  // CRM email log
  const { data: emailLog = [] } = useQuery({
    queryKey: ["admin-crm-log"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("crm_email_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  // Membership stats
  const { data: memberStats } = useQuery({
    queryKey: ["admin-member-stats"],
    queryFn: async () => {
      const [profilesRes, ordersRes, premiumRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("total").eq("status", "paid"),
        supabase.from("site_settings").select("value").eq("key", "manual_premium_users").maybeSingle(),
      ]);
      const totalRevenue = (ordersRes.data || []).reduce((a: number, o: any) => a + Number(o.total), 0);
      const premiumCount = ((premiumRes.data?.value as string[]) || []).length;
      return {
        totalUsers: profilesRes.count ?? 0,
        premiumMembers: premiumCount,
        totalRevenue,
        totalOrders: (ordersRes.data || []).length,
      };
    },
  });

  const markCartReminded = async (userId: string, itemIds: string[]) => {
    const now = new Date().toISOString();
    for (const id of itemIds) {
      await supabase.from("cart_items").update({ reminder_sent_at: now } as any).eq("id", id);
    }
    // Log the CRM action
    await (supabase as any).from("crm_email_log").insert({
      user_id: userId,
      email: "cart-recovery",
      template_name: "abandoned-cart-reminder",
      status: "queued",
      metadata: { item_count: itemIds.length },
    });
    qc.invalidateQueries({ queryKey: ["admin-abandoned-carts"] });
    qc.invalidateQueries({ queryKey: ["admin-crm-log"] });
    toast({ title: "Cart recovery reminder queued" });
  };

  const deleteReview = async (id: string) => {
    await supabase.from("product_reviews").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    toast({ title: "Review deleted" });
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "< 1h ago";
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* CRM Overview Cards */}
      {memberStats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Total Users", value: memberStats.totalUsers, icon: Users, color: "text-gold" },
            { label: "Premium Members", value: memberStats.premiumMembers, icon: Star, color: "text-gold" },
            { label: "Total Orders", value: memberStats.totalOrders, icon: ShoppingCart, color: "text-foreground" },
            { label: "Revenue", value: `$${memberStats.totalRevenue.toFixed(2)}`, icon: Mail, color: "text-foreground" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                  <span className="font-body text-xs uppercase tracking-wider text-muted-foreground">{s.label}</span>
                </div>
                <p className={`mt-2 font-display text-2xl font-bold ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="abandoned">
        <TabsList className="mb-4">
          <TabsTrigger value="abandoned"><ShoppingCart className="mr-1 h-4 w-4" /> Abandoned Carts ({abandonedCarts.length})</TabsTrigger>
          <TabsTrigger value="reviews"><Star className="mr-1 h-4 w-4" /> Review Moderation ({reviews.length})</TabsTrigger>
          <TabsTrigger value="log"><Mail className="mr-1 h-4 w-4" /> Email Log</TabsTrigger>
        </TabsList>

        {/* ABANDONED CARTS */}
        <TabsContent value="abandoned">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-gold" /> Abandoned Cart Recovery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-body text-sm text-muted-foreground mb-4">
                Carts inactive for 1+ hours without checkout. Send recovery reminders to bring customers back.
              </p>
              {abandonedCarts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 font-body text-sm">No abandoned carts found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Abandoned</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {abandonedCarts.map((cart) => (
                      <TableRow key={cart.userId}>
                        <TableCell className="font-mono text-xs">{cart.userId.slice(0, 8)}…</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {cart.items.map((i: any) => (
                              <p key={i.id} className="font-body text-xs">
                                {i.product?.name || "Unknown"} × {i.quantity}
                              </p>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="font-body text-xs font-bold text-gold">${cart.total.toFixed(2)}</TableCell>
                        <TableCell className="font-body text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {timeAgo(cart.oldestItem)}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markCartReminded(cart.userId, cart.items.map((i: any) => i.id))}
                          >
                            <Mail className="mr-1 h-3 w-3" /> Send Reminder
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* REVIEW MODERATION */}
        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Star className="h-4 w-4 text-gold" /> Product Reviews ({reviews.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 font-body text-sm">No reviews yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Review</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviews.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-body text-xs font-medium">{r.product?.name || "—"}</TableCell>
                        <TableCell>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star key={i} className={`h-3 w-3 ${i < r.rating ? "fill-gold text-gold" : "text-muted-foreground"}`} />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {r.title && <p className="font-body text-xs font-semibold">{r.title}</p>}
                          <p className="font-body text-xs text-muted-foreground line-clamp-2">{r.content}</p>
                        </TableCell>
                        <TableCell className="font-body text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteReview(r.id)}>
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* EMAIL LOG */}
        <TabsContent value="log">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Mail className="h-4 w-4 text-gold" /> CRM Email Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              {emailLog.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 font-body text-sm">No emails sent yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Template</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emailLog.map((e: any) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-body text-xs">{e.template_name}</TableCell>
                        <TableCell className="font-mono text-xs">{e.user_id.slice(0, 8)}…</TableCell>
                        <TableCell>
                          <Badge variant={e.status === "sent" ? "default" : e.status === "queued" ? "secondary" : "outline"} className="text-[10px]">
                            {e.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-body text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminCRM;
