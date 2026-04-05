import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Newspaper, Users } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const AdminNewsletter = () => {
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-lg">
            <Newspaper className="h-5 w-5 text-gold" />
            Supascribe Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="font-body text-sm text-muted-foreground">
            Newsletter signups across the site are powered by Supascribe. Manage your subscribers directly on your Supascribe dashboard.
          </p>

          <a
            href="https://app.supascribe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-body text-sm text-gold hover:underline"
          >
            Open Supascribe Dashboard <ExternalLink className="h-3 w-3" />
          </a>
        </CardContent>
      </Card>

      {/* Legacy subscribers collected before Supascribe migration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-lg">
            <Users className="h-5 w-5 text-gold" />
            Legacy Subscribers ({subscribers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 font-body text-xs text-muted-foreground">
            These emails were collected before the Supascribe migration. You can import them into Supascribe via your dashboard.
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
