import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Search, Shield, Star, Crown } from "lucide-react";
import { supabase as supabaseClient } from "@/integrations/supabase/client";

const AdminUsers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: allPoints = [] } = useQuery({
    queryKey: ["admin-all-points"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_points").select("*");
      if (error) throw error;
      return data;
    },
  });

  const toggleAdmin = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
      if (isAdmin) {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      toast({ title: "Role updated" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const adjustPoints = useMutation({
    mutationFn: async ({ userId, amount, reason }: { userId: string; amount: number; reason: string }) => {
      const current = allPoints.find((p) => p.user_id === userId);
      const newBalance = (current?.points ?? 0) + amount;
      const { error: upsertError } = await supabase.from("user_points").upsert({
        user_id: userId,
        points: newBalance,
        total_earned: (current?.total_earned ?? 0) + (amount > 0 ? amount : 0),
      });
      if (upsertError) throw upsertError;
      const { error: histError } = await supabase.from("points_history").insert({
        user_id: userId,
        amount,
        reason,
      });
      if (histError) throw histError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-points"] });
      toast({ title: "Points adjusted" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const filtered = profiles.filter((p) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (p.display_name || "").toLowerCase().includes(s) || p.id.includes(s);
  });

  const getUserRole = (id: string) => roles.find((r) => r.user_id === id && r.role === "admin");
  const getUserPoints = (id: string) => allPoints.find((p) => p.user_id === id)?.points ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <span className="font-body text-xs text-muted-foreground">{filtered.length} users</span>
      </div>

      {isLoading ? (
        <p className="font-body text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="rounded-lg border border-border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((profile) => {
                const isAdmin = !!getUserRole(profile.id);
                const pts = getUserPoints(profile.id);
                return (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {profile.avatar_url ? (
                          <img src={profile.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-gold/20 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-gold">{(profile.display_name || "U")[0].toUpperCase()}</span>
                          </div>
                        )}
                        <div>
                          <p className="font-body text-sm font-medium text-foreground">{profile.display_name || "—"}</p>
                          <p className="font-body text-[10px] text-muted-foreground">{profile.id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-body text-xs text-muted-foreground">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-gold" />
                        <span className="font-body text-sm text-foreground">{pts}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isAdmin && <Badge className="bg-gold/20 text-gold border-gold/30">Admin</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAdmin.mutate({ userId: profile.id, isAdmin })}
                          className="text-xs"
                        >
                          <Shield className="mr-1 h-3 w-3" />
                          {isAdmin ? "Remove Admin" : "Make Admin"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            const amount = prompt("Points to add (negative to deduct):");
                            if (amount && !isNaN(Number(amount))) {
                              adjustPoints.mutate({ userId: profile.id, amount: Number(amount), reason: "Admin adjustment" });
                            }
                          }}
                        >
                          <Star className="mr-1 h-3 w-3" /> Adjust Points
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
