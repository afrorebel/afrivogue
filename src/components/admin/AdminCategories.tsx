import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, ChevronRight } from "lucide-react";

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
}

const AdminCategories = () => {
  const qc = useQueryClient();
  const [newName, setNewName] = useState("");
  const [newParent, setNewParent] = useState<string>("none");

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return (data || []) as Category[];
    },
  });

  const topLevel = categories.filter((c) => !c.parent_id);
  const getChildren = (parentId: string) => categories.filter((c) => c.parent_id === parentId);

  const addMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("categories").insert({
        name: newName.trim(),
        parent_id: newParent === "none" ? null : newParent,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["categories-list"] });
      toast({ title: "Category added" });
      setNewName("");
      setNewParent("none");
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["categories-list"] });
      toast({ title: "Category deleted" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading…</p>;

  return (
    <div className="space-y-6">
      <h2 className="font-display text-lg font-bold text-foreground">Categories</h2>

      {/* Add new */}
      <div className="flex items-end gap-3 flex-wrap">
        <div className="space-y-1 flex-1 min-w-[200px]">
          <Label className="text-xs">Category Name</Label>
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Streetwear" />
        </div>
        <div className="space-y-1 min-w-[180px]">
          <Label className="text-xs">Parent (optional)</Label>
          <Select value={newParent} onValueChange={setNewParent}>
            <SelectTrigger><SelectValue placeholder="None (top-level)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (top-level)</SelectItem>
              {topLevel.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => addMut.mutate()} disabled={!newName.trim() || addMut.isPending} size="sm">
          <Plus className="mr-1 h-4 w-4" /> Add
        </Button>
      </div>

      {/* Category tree */}
      <div className="space-y-2">
        {topLevel.map((cat) => {
          const children = getChildren(cat.id);
          return (
            <div key={cat.id} className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-center justify-between">
                <span className="font-body text-sm font-medium text-foreground">{cat.name}</span>
                <Button variant="ghost" size="sm" className="text-destructive h-7 w-7 p-0" onClick={() => deleteMut.mutate(cat.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              {children.length > 0 && (
                <div className="mt-2 ml-4 space-y-1.5 border-l border-border pl-3">
                  {children.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between">
                      <span className="flex items-center gap-1 font-body text-xs text-muted-foreground">
                        <ChevronRight className="h-3 w-3" /> {sub.name}
                      </span>
                      <Button variant="ghost" size="sm" className="text-destructive h-6 w-6 p-0" onClick={() => deleteMut.mutate(sub.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminCategories;
