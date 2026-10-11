import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/integrations/api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Check, Mail, Trash2 } from "lucide-react";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  handled: boolean;
  created_at: string;
}

/** Messages sent through the contact form. Each one is also emailed to the contact inbox. */
const AdminMessages = () => {
  const qc = useQueryClient();
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["admin-messages"],
    queryFn: async () => {
      const { data, error } = await api.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data as ContactMessage[];
    },
  });

  const toggle = useMutation({
    mutationFn: async (m: ContactMessage) => {
      const { error } = await api.from("contact_messages").update({ handled: !m.handled }).eq("id", m.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-messages"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.from("contact_messages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-messages"] });
      toast({ title: "Message deleted" });
    },
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  const open = messages.filter((m) => !m.handled).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl italic text-foreground">Messages</h2>
        <p className="font-body text-sm text-muted-foreground">
          {messages.length === 0 ? "No messages yet." : `${open} waiting for a reply · ${messages.length} total`}
        </p>
      </div>
      <div className="space-y-3">
        {messages.map((m) => (
          <article key={m.id} className={`rounded-2xl border border-border bg-card p-5 ${m.handled ? "opacity-60" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-body text-sm font-semibold text-foreground">
                  {m.name} <span className="font-normal text-muted-foreground">· {m.email}</span>
                </p>
                <p className="font-body text-xs text-muted-foreground">
                  {m.subject || "General"} · {new Date(m.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {m.handled && <Badge variant="secondary">Replied</Badge>}
                <Button asChild size="sm" variant="outline" className="rounded-full">
                  <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || "Your message to AfriVogue"}`)}`}>
                    <Mail className="mr-1 h-3.5 w-3.5" /> Reply
                  </a>
                </Button>
                <Button size="sm" variant="ghost" className="rounded-full" onClick={() => toggle.mutate(m)}>
                  <Check className="mr-1 h-3.5 w-3.5" /> {m.handled ? "Reopen" : "Mark replied"}
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" aria-label="Delete message" onClick={() => remove.mutate(m.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-wrap font-body text-sm leading-relaxed text-foreground/90">{m.message}</p>
          </article>
        ))}
      </div>
    </div>
  );
};

export default AdminMessages;
