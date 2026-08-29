import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Plus, X, ExternalLink, Upload, Send, Loader2, Link as LinkIconLucide } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const MOODBOARD_CATEGORIES = ["Fashion", "Beauty", "Art", "Design", "Street Style", "Culture"] as const;
type MoodboardCategory = (typeof MOODBOARD_CATEGORIES)[number];

interface MoodboardItem {
  id: string;
  image_url: string;
  caption: string;
  category: string;
  related_trend_id: string | null;
  approved: boolean;
  created_at: string;
  source_url?: string | null;
  submitted_by?: string | null;
}

const GlobalMoodboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<MoodboardCategory | "All">("All");
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitForm, setSubmitForm] = useState({ image_url: "", caption: "", category: "Fashion", source_url: "" });
  const [lightboxItem, setLightboxItem] = useState<MoodboardItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["moodboard-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("moodboard_items")
        .select("*")
        .eq("approved", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as MoodboardItem[];
    },
  });

  const { data: savedIds = [] } = useQuery({
    queryKey: ["saved-moodboard", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_moodboard_items")
        .select("moodboard_item_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data.map((s) => s.moodboard_item_id);
    },
  });

  const relatedTrendIds = useMemo(() => {
    return [...new Set(items.filter((i) => i.related_trend_id).map((i) => i.related_trend_id!))].slice(0, 6);
  }, [items]);

  const { data: relatedTrends = [] } = useQuery({
    queryKey: ["moodboard-related-trends", relatedTrendIds],
    enabled: relatedTrendIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trends")
        .select("id, headline, category, featured_image_url, cultural_significance")
        .in("id", relatedTrendIds)
        .eq("published", true);
      if (error) throw error;
      return data;
    },
  });

  const toggleSave = useMutation({
    mutationFn: async (itemId: string) => {
      if (!user) throw new Error("Login required");
      const isSaved = savedIds.includes(itemId);
      if (isSaved) {
        await supabase.from("saved_moodboard_items").delete().eq("user_id", user.id).eq("moodboard_item_id", itemId);
      } else {
        await supabase.from("saved_moodboard_items").insert({ user_id: user.id, moodboard_item_id: itemId });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-moodboard"] }),
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const file = files[0];
      const ext = file.name.split(".").pop();
      const path = `moodboard/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("trend-images").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("trend-images").getPublicUrl(path);
      setSubmitForm((p) => ({ ...p, image_url: urlData.publicUrl }));
      toast({ title: "Image uploaded" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submitItem = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Login required");
      const { error } = await supabase.from("moodboard_items").insert({
        image_url: submitForm.image_url,
        caption: submitForm.caption,
        category: submitForm.category,
        source_url: submitForm.source_url.trim() || null,
        submitted_by: user.id,
        approved: false,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Submitted", description: "Your inspiration has been submitted for review." });
      setSubmitForm({ image_url: "", caption: "", category: "Fashion", source_url: "" });
      setSubmitOpen(false);
    },
    onError: () => toast({ title: "Error", description: "Failed to submit.", variant: "destructive" }),
  });

  const filtered = useMemo(() => {
    if (activeCategory === "All") return items;
    return items.filter((i) => i.category === activeCategory);
  }, [items, activeCategory]);

  const pill = (active: boolean) =>
    `cursor-pointer rounded-sm border px-3 py-1.5 font-body text-xs font-medium uppercase tracking-wider transition-all duration-200 ${
      active ? "border-gold bg-gold text-primary-foreground" : "border-border bg-transparent text-muted-foreground hover:border-gold/40 hover:text-foreground"
    }`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <header className="pt-28 pb-12 px-6 md:px-16 lg:px-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-gold mb-4">Visual Inspiration</p>
          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-4">Global Moodboard</h1>
          <p className="font-body text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            A curated gallery of visual ideas shaping global fashion and culture.
          </p>
        </motion.div>
      </header>

      <div className="px-6 md:px-16 lg:px-24 flex flex-wrap items-center gap-2 mb-10">
        <button className={pill(activeCategory === "All")} onClick={() => setActiveCategory("All")}>All</button>
        {MOODBOARD_CATEGORIES.map((c) => (
          <button key={c} className={pill(activeCategory === c)} onClick={() => setActiveCategory(c)}>{c}</button>
        ))}

        <div className="ml-auto">
          {user && (
            <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 border-gold/30 text-gold hover:bg-gold/10">
                  <Plus className="h-3.5 w-3.5" /> Submit Inspiration
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-display">Submit Visual Inspiration</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  {/* Image: Upload or URL */}
                  <div>
                    <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Image *</label>
                    <Tabs defaultValue="upload" className="w-full">
                      <TabsList className="w-full">
                        <TabsTrigger value="upload" className="flex-1"><Upload className="mr-1 h-3 w-3" /> Upload</TabsTrigger>
                        <TabsTrigger value="url" className="flex-1"><LinkIconLucide className="mr-1 h-3 w-3" /> URL</TabsTrigger>
                      </TabsList>
                      <TabsContent value="upload" className="mt-2">
                        <div
                          className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-gold"
                          onClick={() => fileRef.current?.click()}
                        >
                          {uploading ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Loader2 className="h-5 w-5 animate-spin" />
                              <span className="font-body text-sm">Uploading…</span>
                            </div>
                          ) : submitForm.image_url ? (
                            <img src={submitForm.image_url} alt="Preview" className="max-h-32 rounded object-cover" />
                          ) : (
                            <div className="text-center">
                              <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                              <p className="mt-1 font-body text-sm text-muted-foreground">Click to upload</p>
                            </div>
                          )}
                        </div>
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                      </TabsContent>
                      <TabsContent value="url" className="mt-2">
                        <Input
                          placeholder="https://example.com/image.jpg"
                          value={submitForm.image_url}
                          onChange={(e) => setSubmitForm((p) => ({ ...p, image_url: e.target.value }))}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>

                  <div>
                    <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Caption</label>
                    <Textarea
                      placeholder="Describe the inspiration..."
                      value={submitForm.caption}
                      onChange={(e) => setSubmitForm((p) => ({ ...p, caption: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Source / Social Profile Link</label>
                    <Input
                      placeholder="https://instagram.com/photographer or original source URL"
                      value={submitForm.source_url}
                      onChange={(e) => setSubmitForm((p) => ({ ...p, source_url: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Category</label>
                    <Select value={submitForm.category} onValueChange={(v) => setSubmitForm((p) => ({ ...p, category: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MOODBOARD_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    className="w-full bg-gold text-primary-foreground hover:bg-gold/90 gap-1.5"
                    disabled={!submitForm.image_url || submitItem.isPending}
                    onClick={() => submitItem.mutate()}
                  >
                    <Send className="h-3.5 w-3.5" /> {submitItem.isPending ? "Submitting..." : "Submit for Review"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">Submissions are reviewed by our editorial team.</p>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Masonry Grid */}
      <section className="px-6 md:px-16 lg:px-24 mb-20">
        {isLoading ? (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="w-full rounded-lg" style={{ height: `${200 + (i % 3) * 80}px` }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-body text-muted-foreground text-lg">No inspirations found in this category yet.</p>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((item, i) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: i * 0.03 }}
                  className="group relative break-inside-avoid rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => setLightboxItem(item)}
                >
                  <img src={item.image_url} alt={item.caption} className="w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <p className="font-body text-sm text-white/90 line-clamp-2">{item.caption}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-body text-[10px] uppercase tracking-wider text-gold">{item.category}</span>
                      {(item as any).source_url && (
                        <a
                          href={(item as any).source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] text-white/70 hover:text-gold flex items-center gap-0.5"
                        >
                          <ExternalLink className="h-3 w-3" /> Source
                        </a>
                      )}
                    </div>
                  </div>
                  {user && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSave.mutate(item.id); }}
                      className="absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-background"
                    >
                      <Heart className={`h-4 w-4 transition-colors ${savedIds.includes(item.id) ? "fill-gold text-gold" : "text-foreground"}`} />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxItem && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-6"
            onClick={() => setLightboxItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="relative max-w-4xl max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setLightboxItem(null)} className="absolute -top-10 right-0 text-white/70 hover:text-white">
                <X className="h-6 w-6" />
              </button>
              <img src={lightboxItem.image_url} alt={lightboxItem.caption} className="max-h-[70vh] w-auto object-contain rounded-lg" />
              <div className="mt-4 text-center space-y-2">
                <p className="font-body text-white text-sm">{lightboxItem.caption}</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="font-body text-[10px] uppercase tracking-wider text-gold">{lightboxItem.category}</span>
                  {(lightboxItem as any).source_url && (
                    <a
                      href={(lightboxItem as any).source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gold hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" /> View Source
                    </a>
                  )}
                  {user && (
                    <button
                      onClick={() => toggleSave.mutate(lightboxItem.id)}
                      className="inline-flex items-center gap-1 text-xs text-gold hover:text-gold/80"
                    >
                      <Heart className={`h-3.5 w-3.5 ${savedIds.includes(lightboxItem.id) ? "fill-gold" : ""}`} />
                      {savedIds.includes(lightboxItem.id) ? "Saved" : "Save"}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Related Stories */}
      {relatedTrends.length > 0 && (
        <section className="px-6 md:px-16 lg:px-24 mb-20">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-8">Related Stories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedTrends.map((trend) => (
              <Link key={trend.id} to={`/trend/${trend.id}`} className="group block rounded-lg overflow-hidden border border-border/50 hover:border-gold/30 transition-colors">
                {trend.featured_image_url && (
                  <div className="aspect-video overflow-hidden">
                    <img src={trend.featured_image_url} alt={trend.headline} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                )}
                <div className="p-4">
                  <span className="font-body text-[10px] uppercase tracking-wider text-gold">{trend.category}</span>
                  <h3 className="font-display text-lg font-semibold mt-1 group-hover:text-gold transition-colors line-clamp-2">{trend.headline}</h3>
                  <p className="font-body text-xs text-muted-foreground mt-2 line-clamp-2">{trend.cultural_significance}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <footer className="border-t border-border/50 py-12 text-center">
        <p className="font-body text-xs uppercase tracking-[0.2em] text-muted-foreground">Afrivogue — Global Moodboard</p>
      </footer>
    </div>
  );
};

export default GlobalMoodboard;
