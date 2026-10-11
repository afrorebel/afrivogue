import PageMasthead from "@/components/editorial/PageMasthead";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import PageMasthead from "@/components/editorial/PageMasthead";
import Footer from "@/components/Footer";
import ProductCard from "@/components/shop/ProductCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
        eyebrow="The Collection"
        title="The"
        accent="Shop"
        intro="Curated custom pieces and affiliate selections celebrating African elegance and contemporary style."
      />
      <main className="px-6 pb-24 md:px-12 lg:px-16">
        <div className="mx-auto max-w-7xl">
        {/* Flash Sales */}
        {flashProducts.length > 0 && (
          <section className="mb-20">
            <div className="mb-8 flex items-center gap-3 border-b border-border/60 pb-4">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" />
              <h2 className="font-body text-[9px] uppercase tracking-[0.4em] text-gold">Flash Sale</h2>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4 md:gap-x-8">
              {flashProducts.slice(0, 4).map((p: any) => (
                <ProductCard key={p.id} product={p} isWishlisted={wishlistIds.includes(p.id)} onWishlistToggle={() => refetchWishlist()} />
              ))}
            </div>
          </section>
        )}

        {/* Category rail + filters */}
        <div className="mb-14 flex flex-col gap-6 border-b border-border/60 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`border-b pb-1 font-body text-[9px] uppercase tracking-[0.3em] transition-colors ${
                  category === c
                    ? "border-gold text-gold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search the edit…"
                className="h-9 w-full rounded-none border-0 border-b border-border bg-transparent pl-6 font-body text-xs focus-visible:border-gold focus-visible:ring-0 focus-visible:ring-offset-0 sm:w-48"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
              <SelectTrigger className="h-9 w-32 rounded-none border-0 border-b border-border bg-transparent px-0 font-body text-[10px] uppercase tracking-[0.2em] focus:ring-0 focus:ring-offset-0">
                <SlidersHorizontal className="mr-2 h-3 w-3" /><SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
                <SelectItem value="affiliate">Affiliate</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-9 w-36 rounded-none border-0 border-b border-border bg-transparent px-0 font-body text-[10px] uppercase tracking-[0.2em] focus:ring-0 focus:ring-offset-0">
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
          <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 md:gap-x-8 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse bg-surface" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-body text-xs uppercase tracking-[0.3em] text-muted-foreground">Nothing in this edit yet.</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 md:gap-x-8 lg:grid-cols-4">
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
