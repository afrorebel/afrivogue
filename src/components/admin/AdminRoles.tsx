import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { Shield, Crown, PenLine, User, Search } from "lucide-react";

const ROLES = ["contributor", "publisher", "editor", "admin"] as const;
type AppRole = typeof ROLES[number];

const roleInfo: Record<AppRole, { label: string; icon: typeof Shield; color: string; desc: string }> = {
  contributor: { label: "Contributor", icon: PenLine, color: "bg-blue-500/20 text-blue-400", desc: "Can submit articles for review" },
  publisher: { label: "Publisher", icon: PenLine, color: "bg-green-500/20 text-green-400", desc: "Auto-granted after first approved article" },
  editor: { label: "Editor", icon: Crown, color: "bg-gold/20 text-gold", desc: "Can manage and curate content" },
  admin: { label: "Admin", icon: Shield, color: "bg-destructive/20 text-destructive", desc: "Full platform access" },
};

const AdminRoles = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole>("publisher");

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles-roles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, display_name, avatar_url").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: allRoles = [] } = useQuery({
    queryKey: ["admin-all-roles"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("*");
      return data || [];
    },
  });

  const getUserRoles = (userId: string) => allRoles.filter((r: any) => r.user_id === userId).map((r: any) => r.role as AppRole);

  const assignRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-all-roles"] });
      toast({ title: "Role assigned" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const removeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-all-roles"] });
      toast({ title: "Role removed" });
    },
  });

  const filtered = profiles.filter((p: any) =>
    !search || (p.display_name || "").toLowerCase().includes(search.toLowerCase()) || p.id.includes(search)
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold text-foreground">User Roles</h2>
        <p className="font-body text-sm text-muted-foreground mt-1">Manage publishing ranks: Contributor → Publisher → Editor</p>
      </div>

      {/* Role legend */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        {ROLES.map((role) => {
          const info = roleInfo[role];
          const count = allRoles.filter((r: any) => r.role === role).length;
          return (
            <div key={role} className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-center gap-2">
                <info.icon className="h-4 w-4 text-gold" />
                <span className="font-body text-sm font-medium text-foreground">{info.label}</span>
                <Badge variant="secondary" className="ml-auto text-[10px]">{count}</Badge>
              </div>
              <p className="mt-1 font-body text-[11px] text-muted-foreground">{info.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users…" className="pl-9" />
      </div>

      {/* Users list */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {filtered.slice(0, 50).map((p: any) => {
          const roles = getUserRoles(p.id);
          return (
            <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-body text-sm font-medium text-foreground truncate">{p.display_name || "Anonymous"}</p>
                  <div className="flex gap-1 mt-0.5 flex-wrap">
                    {roles.map((r) => (
                      <Badge key={r} className={`${roleInfo[r]?.color || ""} text-[10px] cursor-pointer`} onClick={() => removeRole.mutate({ userId: p.id, role: r })} title="Click to remove">
                        {roleInfo[r]?.label || r} ✕
                      </Badge>
                    ))}
                    {roles.length === 0 && <span className="font-body text-[10px] text-muted-foreground">No roles</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                  <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.filter((r) => !roles.includes(r)).map((r) => (
                      <SelectItem key={r} value={r}>{roleInfo[r].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => assignRole.mutate({ userId: p.id, role: selectedRole })}
                  disabled={roles.includes(selectedRole)}>
                  Assign
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminRoles;
