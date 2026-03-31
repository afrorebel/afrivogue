import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Send, MapPin, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const socials = [
  { label: "TikTok", href: "https://www.tiktok.com/@afrivogue", icon: "tiktok" },
  { label: "Pinterest", href: "https://pinterest.com/afrivogue", icon: "pinterest" },
  { label: "Instagram", href: "https://instagram.com/afrivogueonline", icon: "instagram" },
  { label: "YouTube", href: "https://www.youtube.com/afrivogue", icon: "youtube" },
  { label: "X (Twitter)", href: "https://twitter.com/afrivogueonline", icon: "twitter" },
  { label: "Facebook", href: "https://facebook.com/afrivogueonline", icon: "facebook" },
  { label: "Website", href: "https://afrivogue.com/", icon: "globe" },
];

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      // Store contact message as a newsletter subscriber with source "contact"
      const { error } = await supabase.from("newsletter_subscribers").insert({
        email: form.email.trim(),
        source: `contact: ${form.subject || "General"} — ${form.name}`,
      });
      if (error && error.code !== "23505") throw error;
      // Send confirmation email
      const confirmId = crypto.randomUUID();
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "contact-confirmation",
          recipientEmail: form.email.trim(),
          idempotencyKey: `contact-confirm-${confirmId}`,
          templateData: { name: form.name.trim(), subject: form.subject || undefined },
        },
      });
      toast({ title: "Message sent!", description: "We'll get back to you soon." });
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err: any) {
      toast({ title: "Error sending message", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="relative flex items-center justify-center px-6 pb-16 pt-32 md:px-16 lg:px-24">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 text-center"
        >
          <p className="font-body text-xs uppercase tracking-[0.3em] text-primary">Get In Touch</p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            Contact <span className="text-primary">Us</span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg font-body text-sm leading-relaxed text-muted-foreground md:text-base">
            Have a story tip, partnership inquiry, or just want to say hello? We'd love to hear from you.
          </p>
        </motion.div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-6xl px-6 pb-24 md:px-16 lg:px-24">
        <div className="grid gap-12 lg:grid-cols-5">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-3"
          >
            <h2 className="font-display text-xl font-semibold">Send a Message</h2>
            <p className="mt-1 font-body text-sm text-muted-foreground">
              Fill out the form below and we'll respond within 48 hours.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Name <span className="text-primary">*</span>
                  </label>
                  <Input
                    value={form.name}
                    onChange={set("name")}
                    placeholder="Your name"
                    maxLength={100}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Email <span className="text-primary">*</span>
                  </label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    placeholder="you@example.com"
                    maxLength={255}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Subject
                </label>
                <Input
                  value={form.subject}
                  onChange={set("subject")}
                  placeholder="What's this about?"
                  maxLength={200}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Message <span className="text-primary">*</span>
                </label>
                <Textarea
                  value={form.message}
                  onChange={set("message")}
                  placeholder="Tell us more…"
                  rows={5}
                  maxLength={2000}
                  required
                />
              </div>

              <Button type="submit" disabled={loading} className="gap-2">
                <Send className="h-4 w-4" />
                {loading ? "Sending…" : "Send Message"}
              </Button>
            </form>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="space-y-8 lg:col-span-2"
          >
            {/* Email */}
            <div>
              <h3 className="font-display text-lg font-semibold">Email</h3>
              <a
                href="mailto:contact@afrivogue.com"
                className="mt-2 flex items-center gap-2 font-body text-sm text-primary transition-colors hover:text-primary/80"
              >
                <Mail className="h-4 w-4" />
                contact@afrivogue.com
              </a>
            </div>

            {/* Socials */}
            <div>
              <h3 className="font-display text-lg font-semibold">Follow Us</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 font-body text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {s.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Info card */}
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="font-display text-base font-semibold">Partnership & Press</h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-muted-foreground">
                For brand collaborations, media inquiries, or advertising opportunities, please reach out via email with
                "Partnership" in the subject line.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 px-6 py-10 text-center">
        <p className="font-display text-lg font-bold tracking-tight">
          AFRI<span className="text-primary">VOGUE</span>
        </p>
        <p className="mt-1 font-body text-xs text-muted-foreground">
          © {new Date().getFullYear()} Afrivogue. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Contact;
