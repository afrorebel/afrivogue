import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/shop/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
      <main className="mx-auto max-w-7xl px-4 pt-24 pb-16 md:px-8">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <p className="font-body text-xs uppercase tracking-[0.2em] text-gold">The Afrivogue Collection</p>
          <h1 className="mt-2 font-display text-4xl font-bold text-foreground md:text-5xl">Shop</h1>
          <p className="mx-auto mt-3 max-w-lg font-body text-sm text-muted-foreground">
            Curated custom pieces and affiliate selections celebrating African elegance and contemporary style.
          </p>
        </motion.div>

        {/* Flash Sales Banner */}
        {flashProducts.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-destructive" />
              <h2 className="font-display text-xl font-bold text-foreground">Flash Sales</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {flashProducts.slice(0, 4).map((p: any) => (
                <ProductCard key={p.id} product={p} isWishlisted={wishlistIds.includes(p.id)} onWishlistToggle={() => refetchWishlist()} />
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Button key={c} size="sm" variant={category === c ? "default" : "outline"}
                className={category === c ? "bg-gold text-primary-foreground" : ""}
                onClick={() => setCategory(c)}>
                {c}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search…" className="pl-9 font-body text-xs w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
              <SelectTrigger className="w-32 font-body text-xs"><SlidersHorizontal className="mr-1 h-3 w-3" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
                <SelectItem value="affiliate">Affiliate</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-40 font-body text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-body text-muted-foreground">No products found</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {filtered.map((p: any) => (
                <ProductCard key={p.id} product={p} isWishlisted={wishlistIds.includes(p.id)} onWishlistToggle={() => refetchWishlist()} />
              ))}
            </div>
          </AnimatePresence>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Shop;
