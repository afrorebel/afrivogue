import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { ExternalLink, Save, Newspaper, Users } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const AdminNewsletter = () => {
  const qc = useQueryClient();
  const [substackUrl, setSubstackUrl] = useState("afrivogue.substack.com");

  // Load saved Substack URL from site_settings
  const { data: settings } = useQuery({
    queryKey: ["admin-substack-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "substack_url")
        .maybeSingle();
      return data?.value as string | null;
    },
  });

  // Load legacy newsletter subscribers (for reference/export)
  const { data: subscribers = [] } = useQuery({
    queryKey: ["admin-newsletter-subs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .order("subscribed_at", { ascending: false })
        .limit(200);
      return data || [];
    },
  });

  useState(() => {
    if (settings) setSubstackUrl(settings);
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("site_settings")
        .upsert({ key: "substack_url", value: JSON.stringify(substackUrl) });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-substack-settings"] });
      toast({ title: "Saved", description: "Substack URL updated." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-lg">
            <Newspaper className="h-5 w-5 text-gold" />
            Substack Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="font-body text-sm text-muted-foreground">
            Newsletter signups across the site are powered by Substack. Manage your subscribers directly on your Substack dashboard.
          </p>

          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-1 block font-body text-xs font-medium text-muted-foreground">
                Substack Publication URL
              </label>
              <Input
                value={substackUrl}
                onChange={(e) => setSubstackUrl(e.target.value)}
                placeholder="yourpublication.substack.com"
              />
            </div>
            <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} size="sm">
              <Save className="mr-1 h-4 w-4" /> Save
            </Button>
          </div>

          <a
            href={`https://${substackUrl || "afrivogue.substack.com"}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-body text-sm text-gold hover:underline"
          >
            Open Substack Dashboard <ExternalLink className="h-3 w-3" />
          </a>
        </CardContent>
      </Card>

      {/* Legacy subscribers collected before Substack migration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-lg">
            <Users className="h-5 w-5 text-gold" />
            Legacy Subscribers ({subscribers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 font-body text-xs text-muted-foreground">
            These emails were collected before the Substack migration. You can import them into Substack via Settings → Import.
          </p>
          {subscribers.length === 0 ? (
            <p className="font-body text-sm text-muted-foreground">No legacy subscribers.</p>
          ) : (
            <div className="max-h-80 overflow-y-auto rounded border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscribers.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-body text-sm">{s.email}</TableCell>
                      <TableCell className="font-body text-xs text-muted-foreground">{s.source || "—"}</TableCell>
                      <TableCell className="font-body text-xs text-muted-foreground">
                        {new Date(s.subscribed_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNewsletter;
