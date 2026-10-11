import PageMasthead from "@/components/editorial/PageMasthead";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/shop/ProductCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { categoryColor } from "@/lib/categoryColors";

const CATEGORIES = ["All", "Fashion", "Beauty", "Luxury", "Art & Design", "Culture", "Accessories"];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "featured", label: "Featured" },
];

const Shop = () => {
  const { user } = useAuth();
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("newest");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "custom" | "affiliate">("all");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["shop-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("published", true);
      if (error) throw error;
      return (data || []).map((p: any) => ({ ...p, images: (p.images as string[]) || [] }));
    },
  });

  const { data: wishlistIds = [], refetch: refetchWishlist } = useQuery({
    queryKey: ["wishlist-ids", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("wishlists").select("product_id").eq("user_id", user.id);
      return (data || []).map((w: any) => w.product_id);
    },
    enabled: !!user,
  });

  // Flash sales section
  const flashProducts = products.filter(
    (p: any) => p.flash_sale && p.flash_sale_end && new Date(p.flash_sale_end) > new Date()
  );

  let filtered = products.filter((p: any) => {
    if (category !== "All" && p.category !== category) return false;
    if (typeFilter !== "all" && p.product_type !== typeFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  filtered = [...filtered].sort((a: any, b: any) => {
    switch (sort) {
      case "price-asc": return a.price - b.price;
      case "price-desc": return b.price - a.price;
      case "featured": return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PageMasthead
        eyebrow="The collection"
        title="The"
        accent="Shop"
        intro="Pieces we would wear ourselves: member-exclusive designs and hand-picked finds from African and diaspora makers."
      />
      <main className="px-4 pb-24 md:px-8 lg:px-12">
        <div className="mx-auto max-w-[1440px]">
        {/* Flash Sales */}
        {flashProducts.length > 0 && (
          <section className="mb-20">
            <div className="mb-6 flex items-center gap-3">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-destructive" />
              <h2 className="font-display text-3xl italic text-foreground">Flash Sale</h2>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
              {flashProducts.slice(0, 4).map((p: any) => (
                <ProductCard key={p.id} product={p} isWishlisted={wishlistIds.includes(p.id)} onWishlistToggle={() => refetchWishlist()} />
              ))}
            </div>
          </section>
        )}

        {/* Category rail + filters */}
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar md:mx-0 md:flex-wrap md:px-0">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 font-body text-sm font-medium transition-all ${
                  category === c ? "border-transparent text-white shadow-soft" : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
                style={
                  category === c
                    ? { backgroundColor: c === "All" ? "hsl(var(--foreground))" : categoryColor(c), color: c === "All" ? "hsl(var(--background))" : undefined }
                    : undefined
                }
              >
                {c !== "All" && category !== c && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: categoryColor(c) }} />}
                {c}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search the edit…"
                className="h-10 w-full rounded-full border-border bg-card pl-10 font-body text-sm focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/20 focus-visible:ring-offset-0 sm:w-56"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
              <SelectTrigger className="h-10 w-36 rounded-full border-border bg-card px-4 font-body text-sm focus:ring-2 focus:ring-gold/20 focus:ring-offset-0">
                <SlidersHorizontal className="mr-2 h-3 w-3" /><SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
                <SelectItem value="affiliate">Affiliate</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-10 w-44 rounded-full border-border bg-card px-4 font-body text-sm focus:ring-2 focus:ring-gold/20 focus:ring-offset-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-surface" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-body text-xs uppercase tracking-[0.3em] text-muted-foreground">Nothing in this edit yet.</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
              {filtered.map((p: any) => (
                <ProductCard key={p.id} product={p} isWishlisted={wishlistIds.includes(p.id)} onWishlistToggle={() => refetchWishlist()} />
              ))}
            </div>
          </AnimatePresence>
        )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Shop;
