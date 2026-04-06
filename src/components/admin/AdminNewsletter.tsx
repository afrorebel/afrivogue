/**
 * AdminNewsletter — Phase 4
 * Native newsletter management: subscribers, campaign compose/send, history.
 * Replaces the old Supascribe integration entirely.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Mail,
  Send,
  Download,
  Trash2,
  Plus,
  Edit,
  RefreshCw,
  Newspaper,
  BarChart3,
  Clock,
  CheckCircle2,
  Loader2,
  Eye,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────
interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  status: string;
  created_at: string;
}

interface Campaign {
  id: string;
  subject: string;
  body_html: string;
  status: "draft" | "sending" | "sent";
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
  sent_count?: number;
}

interface SubscribersResponse {
  subscribers: Subscriber[];
  total: number;
}

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:3001/api") as string;

// ─── API helpers ────────────────────────────────────────────────────────────
async function fetchSubscribers(page: number): Promise<SubscribersResponse> {
  const { data, error } = await api.fetch(
    `/newsletter/subscribers?limit=50&offset=${page * 50}`
  );
  if (error) throw new Error(String(error));
  return data as SubscribersResponse;
}

async function fetchCampaigns(): Promise<Campaign[]> {
  const { data, error } = await api.fetch("/newsletter/campaigns");
  if (error) throw new Error(String(error));
  return (data as Campaign[]) || [];
}

async function updateCampaign(id: string, payload: { subject: string; body_html: string }) {
  const { data, error } = await api.fetch(`/newsletter/campaigns/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (error) throw new Error(String(error));
  return data as Campaign;
}

async function createCampaign(payload: { subject: string; body_html: string }) {
  const { data, error } = await api.fetch("/newsletter/campaigns", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (error) throw new Error(String(error));
  return data as Campaign;
}

async function deleteCampaignApi(id: string) {
  const { error } = await api.fetch(`/newsletter/campaigns/${id}`, { method: "DELETE" });
  if (error) throw new Error(String(error));
}

async function deleteSubApi(id: string) {
  const { error } = await api.fetch(`/newsletter/subscribers/${id}`, { method: "DELETE" });
  if (error) throw new Error(String(error));
}

async function sendCampaignApi(id: string) {
  const { data, error } = await api.fetch(`/newsletter/campaigns/${id}/send`, {
    method: "POST",
  });
  if (error) throw new Error(String(error));
  return data as { success: boolean; recipient_count: number };
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: Campaign["status"] }) {
  if (status === "sent")
    return (
      <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1 border">
        <CheckCircle2 className="h-3 w-3" /> Sent
      </Badge>
    );
  if (status === "sending")
    return (
      <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 gap-1 border">
        <Loader2 className="h-3 w-3 animate-spin" /> Sending
      </Badge>
    );
  return (
    <Badge variant="outline" className="gap-1">
      <Clock className="h-3 w-3" /> Draft
    </Badge>
  );
}

const BLANK_TEMPLATE = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:0;background:#faf9f7;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:4px;">
        <tr>
          <td style="background:#0a0a0a;padding:32px 40px;text-align:center;">
            <h1 style="color:#c9a84c;font-size:28px;letter-spacing:0.2em;margin:0;font-weight:400;">AFRIVOGUE</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;color:#333;line-height:1.7;font-size:15px;">
            <h2 style="font-size:22px;margin-bottom:16px;color:#0a0a0a;">Newsletter Heading</h2>
            <p>Your content goes here. Write with elegance and intentionality.</p>
            <p style="margin-top:24px;">
              <a href="https://afrivogue.com" style="background:#0a0a0a;color:#c9a84c;padding:12px 28px;text-decoration:none;font-size:13px;letter-spacing:0.1em;">READ MORE &rarr;</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #eee;text-align:center;font-size:12px;color:#999;">
            &copy; AfriVogue &middot;
            <a href="https://afrivogue.com/unsubscribe?token={{unsubscribe_token}}" style="color:#999;">Unsubscribe</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ─── Compose Dialog ─────────────────────────────────────────────────────────
interface ComposeProps {
  open: boolean;
  onClose: () => void;
  existing: Campaign | null;
  onSaved: () => void;
}

function ComposeDialog({ open, onClose, existing, onSaved }: ComposeProps) {
  const { toast } = useToast();
  const [subject, setSubject] = useState(existing?.subject ?? "");
  const [body, setBody]     = useState(existing?.body_html ?? "");
  const [preview, setPreview] = useState(false);
  const [saving, setSaving]   = useState(false);

  const handleSave = async () => {
    if (!subject.trim() || !body.trim()) {
      toast({ title: "Missing fields", description: "Subject and body are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (existing) {
        await updateCampaign(existing.id, { subject, body_html: body });
        toast({ title: "Campaign updated" });
      } else {
        await createCampaign({ subject, body_html: body });
        toast({ title: "Draft saved" });
      }
      onSaved();
      onClose();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            {existing ? "Edit Campaign" : "New Campaign"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="subj">Subject Line</Label>
            <Input
              id="subj"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Your subject line…"
              className="font-body"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="body">Email Body (HTML)</Label>
              <div className="flex gap-2">
                {!existing && body.trim() === "" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setBody(BLANK_TEMPLATE)}
                  >
                    Insert template
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreview((p) => !p)}
                  className="gap-1 text-xs"
                >
                  <Eye className="h-3 w-3" />
                  {preview ? "Edit" : "Preview"}
                </Button>
              </div>
            </div>
            {preview ? (
              <div
                className="min-h-80 rounded border border-border bg-white p-4 font-body text-sm"
                dangerouslySetInnerHTML={{ __html: body }}
              />
            ) : (
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="<p>Write your newsletter HTML here…</p>"
                className="min-h-80 font-mono text-xs"
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {existing ? "Save Changes" : "Save Draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────
const AdminNewsletter = () => {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [subPage, setSubPage]           = useState(0);
  const [subSearch, setSubSearch]       = useState("");
  const [composeOpen, setComposeOpen]   = useState(false);
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);
  const [sendTarget, setSendTarget]     = useState<Campaign | null>(null);
  const [deleteSubId, setDeleteSubId]   = useState<string | null>(null);
  const [deleteCampId, setDeleteCampId] = useState<string | null>(null);

  const { data: subsData, isLoading: subLoading, refetch: refetchSubs } = useQuery({
    queryKey: ["nl-subscribers", subPage],
    queryFn: () => fetchSubscribers(subPage),
  });

  const { data: campaigns = [], isLoading: campLoading, refetch: refetchCamps } = useQuery({
    queryKey: ["nl-campaigns"],
    queryFn: fetchCampaigns,
  });

  const deleteSubMut = useMutation({
    mutationFn: deleteSubApi,
    onSuccess: () => {
      toast({ title: "Subscriber removed" });
      qc.invalidateQueries({ queryKey: ["nl-subscribers"] });
      setDeleteSubId(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteCampMut = useMutation({
    mutationFn: deleteCampaignApi,
    onSuccess: () => {
      toast({ title: "Campaign deleted" });
      qc.invalidateQueries({ queryKey: ["nl-campaigns"] });
      setDeleteCampId(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const sendMut = useMutation({
    mutationFn: sendCampaignApi,
    onSuccess: (res) => {
      toast({
        title: "Campaign sent!",
        description: `Delivered to ${res.recipient_count} subscriber${res.recipient_count !== 1 ? "s" : ""}.`,
      });
      qc.invalidateQueries({ queryKey: ["nl-campaigns"] });
      setSendTarget(null);
    },
    onError: (e: any) => toast({ title: "Send failed", description: e.message, variant: "destructive" }),
  });

  const totalSubs  = subsData?.total ?? 0;
  const sentCount  = campaigns.filter((c) => c.status === "sent").length;
  const draftCount = campaigns.filter((c) => c.status === "draft").length;

  const displayedSubs = (subsData?.subscribers ?? []).filter(
    (s) =>
      !subSearch ||
      s.email.toLowerCase().includes(subSearch.toLowerCase()) ||
      (s.name ?? "").toLowerCase().includes(subSearch.toLowerCase())
  );

  const handleExport = () => {
    const token = localStorage.getItem("afrivogue_token");
    fetch(`${API_BASE}/newsletter/subscribers/export`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "afrivogue-subscribers.csv";
        a.click();
      })
      .catch(() => toast({ title: "Export failed", variant: "destructive" }));
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { Icon: Users,     label: "Subscribers",    value: totalSubs,  color: "text-gold" },
          { Icon: Newspaper, label: "Campaigns Sent", value: sentCount,  color: "text-emerald-500" },
          { Icon: Edit,      label: "Drafts",         value: draftCount, color: "text-amber-500" },
          { Icon: BarChart3, label: "List Pages",     value: Math.ceil(totalSubs / 50) || 1, color: "text-blue-500" },
        ].map(({ Icon, label, value, color }) => (
          <div key={label} className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
            <div className={`rounded-full bg-muted p-2 ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="font-display text-xl font-bold leading-tight">{value}</p>
              <p className="font-body text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList className="mb-4">
          <TabsTrigger value="campaigns" className="gap-2">
            <Mail className="h-4 w-4" /> Campaigns
          </TabsTrigger>
          <TabsTrigger value="subscribers" className="gap-2">
            <Users className="h-4 w-4" /> Subscribers
          </TabsTrigger>
        </TabsList>

        {/* Campaigns */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">Email Campaigns</h2>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => refetchCamps()} className="gap-1 text-xs">
                <RefreshCw className="h-3 w-3" /> Refresh
              </Button>
              <Button
                size="sm"
                onClick={() => { setEditCampaign(null); setComposeOpen(true); }}
                className="gap-1"
              >
                <Plus className="h-4 w-4" /> New Campaign
              </Button>
            </div>
          </div>

          {campLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center rounded-lg border border-border">
              <Mail className="h-10 w-10 text-muted-foreground/40" />
              <p className="font-display text-sm font-medium">No campaigns yet</p>
              <p className="font-body text-xs text-muted-foreground">Create your first campaign to reach your subscribers.</p>
              <Button size="sm" onClick={() => { setEditCampaign(null); setComposeOpen(true); }} className="mt-2 gap-1">
                <Plus className="h-4 w-4" /> Create Campaign
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Created</TableHead>
                    <TableHead className="hidden sm:table-cell">Sent</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-body font-medium max-w-xs truncate">{c.subject}</TableCell>
                      <TableCell><StatusBadge status={c.status} /></TableCell>
                      <TableCell className="hidden sm:table-cell font-body text-xs text-muted-foreground">{fmtDate(c.created_at)}</TableCell>
                      <TableCell className="hidden sm:table-cell font-body text-xs text-muted-foreground">
                        {c.status === "sent" ? fmtDate(c.sent_at) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {c.status === "draft" && (
                            <>
                              <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit"
                                onClick={() => { setEditCampaign(c); setComposeOpen(true); }}>
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-gold hover:text-gold" title="Send"
                                onClick={() => setSendTarget(c)}>
                                <Send className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title="Delete"
                                onClick={() => setDeleteCampId(c.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                          {c.status === "sent" && (
                            <span className="font-body text-xs text-muted-foreground pr-2">
                              {c.sent_count ?? "—"} recipients
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Subscribers */}
        <TabsContent value="subscribers" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-base font-semibold">
              Subscribers
              {totalSubs > 0 && (
                <span className="ml-2 font-body text-sm font-normal text-muted-foreground">({totalSubs} total)</span>
              )}
            </h2>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search…"
                value={subSearch}
                onChange={(e) => setSubSearch(e.target.value)}
                className="h-8 w-44 font-body text-xs"
              />
              <Button variant="outline" size="sm" onClick={handleExport} className="gap-1 text-xs whitespace-nowrap">
                <Download className="h-3 w-3" /> Export CSV
              </Button>
              <Button variant="ghost" size="sm" onClick={() => refetchSubs()} className="gap-1 text-xs">
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {subLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : displayedSubs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center rounded-lg border border-border">
              <Users className="h-10 w-10 text-muted-foreground/40" />
              <p className="font-body text-sm text-muted-foreground">
                {subSearch ? "No subscribers match your search." : "No subscribers yet."}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="max-h-[520px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead className="hidden sm:table-cell">Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Subscribed</TableHead>
                      <TableHead className="text-right">Remove</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedSubs.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-body text-sm">{s.email}</TableCell>
                        <TableCell className="hidden sm:table-cell font-body text-sm text-muted-foreground">{s.name ?? "—"}</TableCell>
                        <TableCell className="hidden sm:table-cell font-body text-xs text-muted-foreground">{fmtDate(s.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => setDeleteSubId(s.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalSubs > 50 && (
                <div className="flex items-center justify-between border-t border-border px-4 py-3">
                  <p className="font-body text-xs text-muted-foreground">
                    Page {subPage + 1} of {Math.ceil(totalSubs / 50)}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={subPage === 0}
                      onClick={() => setSubPage((p) => Math.max(0, p - 1))} className="text-xs">
                      Prev
                    </Button>
                    <Button variant="outline" size="sm" disabled={(subPage + 1) * 50 >= totalSubs}
                      onClick={() => setSubPage((p) => p + 1)} className="text-xs">
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Compose / Edit dialog */}
      {composeOpen && (
        <ComposeDialog
          open={composeOpen}
          onClose={() => { setComposeOpen(false); setEditCampaign(null); }}
          existing={editCampaign}
          onSaved={() => qc.invalidateQueries({ queryKey: ["nl-campaigns"] })}
        />
      )}

      {/* Send confirmation */}
      <AlertDialog open={!!sendTarget} onOpenChange={(v) => { if (!v) setSendTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Send Campaign?</AlertDialogTitle>
            <AlertDialogDescription className="font-body text-sm">
              <strong className="text-foreground">"{sendTarget?.subject}"</strong> will be sent to all{" "}
              <strong className="text-foreground">{totalSubs}</strong> active subscriber
              {totalSubs !== 1 ? "s" : ""} immediately. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => sendTarget && sendMut.mutate(sendTarget.id)}
              disabled={sendMut.isPending}
              className="gap-2"
            >
              {sendMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete subscriber confirmation */}
      <AlertDialog open={!!deleteSubId} onOpenChange={(v) => { if (!v) setDeleteSubId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Remove Subscriber?</AlertDialogTitle>
            <AlertDialogDescription className="font-body text-sm">
              This will permanently remove this subscriber from your list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteSubId && deleteSubMut.mutate(deleteSubId)}
              disabled={deleteSubMut.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteSubMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete campaign confirmation */}
      <AlertDialog open={!!deleteCampId} onOpenChange={(v) => { if (!v) setDeleteCampId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Delete Campaign?</AlertDialogTitle>
            <AlertDialogDescription className="font-body text-sm">
              This draft will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCampId && deleteCampMut.mutate(deleteCampId)}
              disabled={deleteCampMut.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteCampMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminNewsletter;
