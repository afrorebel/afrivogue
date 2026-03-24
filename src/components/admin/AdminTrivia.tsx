import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Trash2, Eye, EyeOff, Play, Search } from "lucide-react";

const AdminTrivia = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ["admin-trivia"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trivia_questions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase
        .from("trivia_questions")
        .update({ published: !published })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-trivia"] });
      toast({ title: "Updated" });
    },
  });

  const deleteQuestion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("trivia_questions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-trivia"] });
      toast({ title: "Deleted" });
    },
  });

  const triggerPipeline = async () => {
    toast({ title: "Running trivia pipeline…" });
    const { error } = await supabase.functions.invoke("ingest-trivia");
    if (error) {
      toast({ title: "Pipeline failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Pipeline complete" });
      qc.invalidateQueries({ queryKey: ["admin-trivia"] });
    }
  };

  const categories = ["All", ...Array.from(new Set(questions.map((q) => q.category)))];

  const filtered = questions.filter((q) => {
    if (filterCat !== "All" && q.category !== filterCat) return false;
    if (search && !q.question.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-foreground">
          Trivia Questions ({filtered.length})
        </h2>
        <Button size="sm" onClick={triggerPipeline}>
          <Play className="mr-1 h-4 w-4" /> Run Trivia Pipeline
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search questions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={filterCat === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterCat(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="max-w-xs truncate font-body text-sm">
                    {q.question}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{q.category}</Badge>
                  </TableCell>
                  <TableCell className="text-xs capitalize">{q.difficulty}</TableCell>
                  <TableCell>
                    <Badge variant={q.published ? "default" : "secondary"}>
                      {q.published ? "Published" : "Draft"}
                    </Badge>
                    {q.needs_review && (
                      <Badge variant="destructive" className="ml-1">Review</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => togglePublish.mutate({ id: q.id, published: q.published })}
                      >
                        {q.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => {
                          if (confirm("Delete this question?")) deleteQuestion.mutate(q.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No questions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminTrivia;
