import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductReviews from "@/components/shop/ProductReviews";
import ProductBundles from "@/components/shop/ProductBundles";
import CrossSellProducts from "@/components/shop/CrossSellProducts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingBag, ExternalLink, ArrowLeft, Clock, Minus, Plus, Share2, Crown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const ProductDetail = () => {
  const { id } = useParams();
  const { user, subscribed, isAdmin } = useAuth();
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>();
  const [selectedColor, setSelectedColor] = useState<string>();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
      if (error) throw error;
      return { ...data, images: (data.images as string[]) || [], sizes: (data.sizes as string[]) || [], colors: (data.colors as string[]) || [], tags: (data.tags as string[]) || [] };
    },
    enabled: !!id,
  });



  const { data: isWishlisted = false, refetch: refetchWish } = useQuery({
    queryKey: ["wish-check", user?.id, id],
    queryFn: async () => {
      if (!user) return false;
      const { count } = await supabase.from("wishlists").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("product_id", id!);
      return (count || 0) > 0;
    },
    enabled: !!user && !!id,
  });

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-background"><p className="text-muted-foreground">Loading…</p></div>;
  if (!product) return <div className="flex min-h-screen items-center justify-center bg-background"><p className="text-muted-foreground">Product not found</p></div>;

  const isFlashActive = product.flash_sale && product.flash_sale_end && new Date(product.flash_sale_end) > new Date();
  const effectivePrice = isFlashActive && product.flash_sale_price ? product.flash_sale_price : product.price;
  const isAffiliate = product.product_type === "affiliate";
  const isCustom = product.product_type === "custom";
  const premiumRequired = isCustom && !subscribed && !isAdmin;
  const outOfStock = product.stock <= 0 && !isAffiliate;

  const handleAdd = async () => {
    if (!user) { toast({ title: "Sign in to add to cart", variant: "destructive" }); return; }
    if (product.sizes.length > 0 && !selectedSize) { toast({ title: "Please select a size", variant: "destructive" }); return; }
    await addToCart(product.id, quantity, selectedSize, selectedColor);
    toast({ title: `${product.name} added to cart` });
  };

  const toggleWish = async () => {
    if (!user) { toast({ title: "Sign in first", variant: "destructive" }); return; }
    if (isWishlisted) {
      await supabase.from("wishlists").delete().eq("user_id", user.id).eq("product_id", product.id);
    } else {
      await supabase.from("wishlists").insert({ user_id: user.id, product_id: product.id, notify_back_in_stock: outOfStock });
    }
    refetchWish();
  };

  const share = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link copied!" });
  };

  const imgs = product.images.length > 0 ? product.images : ["/placeholder.svg"];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pt-24 pb-16 md:px-8">
        <Link to="/shop" className="mb-6 inline-flex items-center gap-1 font-body text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Back to Shop
        </Link>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Images */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="relative aspect-[3/4] overflow-hidden rounded-lg">
              <img src={imgs[selectedImage]} alt={product.name} className="h-full w-full object-cover" />
              {isFlashActive && (
                <div className="absolute left-3 top-3 flex items-center gap-1 rounded-sm bg-destructive px-2 py-1">
                  <Clock className="h-3 w-3 text-destructive-foreground" />
                  <span className="font-body text-[10px] font-bold uppercase text-destructive-foreground">Flash Sale</span>
                </div>
              )}
            </div>
            {imgs.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {imgs.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)}
                    className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded border-2 ${i === selectedImage ? "border-gold" : "border-border"}`}>
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Info */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <p className="font-body text-xs uppercase tracking-[0.15em] text-muted-foreground">{product.category}</p>
              <h1 className="mt-1 font-display text-2xl font-bold text-foreground md:text-3xl">{product.name}</h1>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="font-display text-2xl font-bold text-gold">${effectivePrice.toFixed(2)}</span>
                {(product.compare_at_price && product.compare_at_price > effectivePrice) && (
                  <span className="font-body text-sm text-muted-foreground line-through">${Number(product.compare_at_price).toFixed(2)}</span>
                )}
              </div>
            </div>

            <p className="font-body text-sm leading-relaxed text-muted-foreground">{product.description}</p>

            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {product.tags.map((t) => <Badge key={t} variant="outline" className="font-body text-[10px]">{t}</Badge>)}
              </div>
            )}

            {/* Sizes */}
            {product.sizes.length > 0 && (
              <div>
                <p className="mb-2 font-body text-xs font-medium text-foreground">Size</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <Button key={s} size="sm" variant={selectedSize === s ? "default" : "outline"}
                      className={selectedSize === s ? "bg-gold text-primary-foreground" : ""}
                      onClick={() => setSelectedSize(s)}>{s}</Button>
                  ))}
                </div>
              </div>
            )}

            {/* Colors */}
            {product.colors.length > 0 && (
              <div>
                <p className="mb-2 font-body text-xs font-medium text-foreground">Color</p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c) => (
                    <Button key={c} size="sm" variant={selectedColor === c ? "default" : "outline"}
                      className={selectedColor === c ? "bg-gold text-primary-foreground" : ""}
                      onClick={() => setSelectedColor(c)}>{c}</Button>
                  ))}
                </div>
              </div>
            )}

            {/* Premium gate for custom products */}
            {premiumRequired && (
              <div className="rounded-lg border border-gold/30 bg-gold/5 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-gold" />
                  <p className="font-display text-sm font-bold text-foreground">Members Exclusive</p>
                </div>
                <p className="font-body text-xs text-muted-foreground">
                  Custom pieces are available exclusively to Afrivogue Collective members.
                </p>
                <Button asChild className="w-full bg-gold hover:bg-gold/90">
                  <Link to="/membership">Join the Collective</Link>
                </Button>
              </div>
            )}

            {/* Quantity & CTA */}
            {!isAffiliate && !premiumRequired ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <p className="font-body text-xs font-medium text-foreground">Qty</p>
                  <div className="flex items-center gap-1 rounded border border-border">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus className="h-3 w-3" /></Button>
                    <span className="w-8 text-center font-body text-sm">{quantity}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQuantity(quantity + 1)}><Plus className="h-3 w-3" /></Button>
                  </div>
                  <span className="font-body text-xs text-muted-foreground">{product.stock} in stock</span>
                </div>
                <Button className="w-full" size="lg" disabled={outOfStock} onClick={handleAdd}>
                  {outOfStock ? "Out of Stock" : <><ShoppingBag className="mr-2 h-4 w-4" /> Add to Bag</>}
                </Button>
              </div>
            ) : (
              <Button className="w-full" size="lg" asChild>
                <a href={product.affiliate_url || "#"} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" /> Shop at Partner
                </a>
              </Button>
            )}

            {outOfStock && (
              <Button variant="outline" className="w-full" onClick={() => {
                if (!user) { toast({ title: "Sign in first", variant: "destructive" }); return; }
                supabase.from("wishlists").upsert({ user_id: user.id, product_id: product.id, notify_back_in_stock: true });
                toast({ title: "We'll notify you when it's back!" });
              }}>
                Notify me when back in stock
              </Button>
            )}

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={toggleWish}>
                <Heart className={`mr-1 h-4 w-4 ${isWishlisted ? "fill-destructive text-destructive" : ""}`} />
                {isWishlisted ? "Saved" : "Save"}
              </Button>
              <Button variant="outline" size="sm" onClick={share}>
                <Share2 className="mr-1 h-4 w-4" /> Share
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Bundles */}
        <div className="mt-16">
          <ProductBundles currentProductId={product.id} />
        </div>

        {/* Reviews */}
        <div className="mt-16">
          <ProductReviews productId={product.id} />
        </div>

        {/* Cross-sell */}
        <CrossSellProducts productId={product.id} category={product.category} />
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
