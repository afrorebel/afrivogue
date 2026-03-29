import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Send, ArrowLeft } from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";
import ImageUpload from "@/components/shop/ImageUpload";

const CATEGORIES = ["Fashion", "Beauty", "Culture", "Lifestyle", "Art & Design", "Business of Fashion"];

const SubmitArticle = () => {
  const { user, loading, subscribed, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "",
    tags: "",
    meta_description: "",
    images: [] as string[],
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-6">
          <h1 className="font-display text-2xl font-bold text-foreground">Sign in to contribute</h1>
          <p className="mt-2 font-body text-sm text-muted-foreground">You need to be a member to submit articles.</p>
          <Link to="/auth">
            <Button className="mt-4 bg-gold text-primary-foreground hover:bg-gold/90">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!subscribed && !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-6">
          <h1 className="font-display text-2xl font-bold text-foreground">Members Only</h1>
          <p className="mt-2 font-body text-sm text-muted-foreground">Article submissions are available to Afrivogue Collective members.</p>
          <Link to="/membership">
            <Button className="mt-4 bg-gold text-primary-foreground hover:bg-gold/90">Join the Collective</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim() || !form.category) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
      const { error } = await supabase.from("article_submissions").insert({
        user_id: user.id,
        title: form.title.trim(),
        content: form.content.trim(),
        category: form.category,
        tags,
        images: form.images,
        meta_description: form.meta_description.trim() || null,
      });
      if (error) throw error;
      toast({ title: "Submitted!", description: "Your article has been submitted for editorial review." });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-4xl px-6 pt-28 pb-20">
        <Link to="/dashboard" className="mb-6 inline-flex items-center gap-2 font-body text-xs uppercase tracking-wider text-muted-foreground hover:text-gold">
          <ArrowLeft className="h-3 w-3" /> Dashboard
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="font-body text-[10px] font-bold uppercase tracking-[0.3em] text-gold mb-3">Contribute</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">Submit an Editorial</h1>
          <p className="font-body text-sm text-muted-foreground mb-10">
            Share your cultural insights with the Afrivogue community. Use the rich editor to add headings, images, embeds, and more. Approved articles earn you 200 points.
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">Title *</label>
            <Input
              placeholder="Your article headline"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              maxLength={200}
            />
          </div>

          <div>
            <label className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">Category *</label>
            <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
              <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">Meta Description (SEO)</label>
            <Textarea
              placeholder="A short summary for search engines (max 160 chars)"
              value={form.meta_description}
              onChange={(e) => setForm((p) => ({ ...p, meta_description: e.target.value }))}
              rows={2}
              maxLength={160}
            />
            <p className="font-body text-[10px] text-muted-foreground mt-1">{form.meta_description.length}/160</p>
          </div>

          <div>
            <label className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">Content *</label>
            <RichTextEditor
              content={form.content}
              onChange={(html) => setForm((p) => ({ ...p, content: html }))}
              placeholder="Write your article here… Use the toolbar to add headings, images, embeds, and formatting."
            />
          </div>

          <ImageUpload
            bucket="trend-images"
            folder="submissions"
            value={form.images}
            onChange={(urls) => setForm((p) => ({ ...p, images: urls }))}
            label="Featured Images (optional)"
          />

          <div>
            <label className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">Tags (optional)</label>
            <Input
              placeholder="fashion, culture, textile (comma-separated)"
              value={form.tags}
              onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
            />
          </div>

          <Button type="submit" disabled={submitting} className="bg-gold text-primary-foreground hover:bg-gold/90 gap-2">
            <Send className="h-4 w-4" /> {submitting ? "Submitting…" : "Submit for Review"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SubmitArticle;
