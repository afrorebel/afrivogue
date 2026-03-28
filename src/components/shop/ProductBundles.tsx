import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Package, Crown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface BundleProduct {
  id: string;
  name: string;
  price: number;
  images: string[];
  product_type: string;
}

interface Bundle {
  id: string;
  name: string;
  description: string;
  discount_percentage: number;
  products: BundleProduct[];
}

const ProductBundles = ({ currentProductId }: { currentProductId?: string }) => {
  const { user, subscribed, isAdmin } = useAuth();
  const { addToCart } = useCart();

  const { data: bundles = [] } = useQuery({
    queryKey: ["product-bundles", currentProductId],
    queryFn: async () => {
      // Get published bundles
      const { data: allBundles } = await supabase
        .from("product_bundles")
        .select("*")
        .eq("published", true);

      if (!allBundles?.length) return [];

      // Get bundle items with products
      const bundleIds = allBundles.map((b: any) => b.id);
      const { data: items } = await supabase
        .from("bundle_items")
        .select("*, product:products(*)")
        .in("bundle_id", bundleIds);

      // Group products by bundle
      const bundleMap: Record<string, BundleProduct[]> = {};
      (items || []).forEach((item: any) => {
        if (!item.product) return;
        if (!bundleMap[item.bundle_id]) bundleMap[item.bundle_id] = [];
        bundleMap[item.bundle_id].push({
          ...item.product,
          images: (item.product.images as string[]) || [],
        });
      });

      // If currentProductId, only show bundles containing that product
      return allBundles
        .map((b: any) => ({ ...b, products: bundleMap[b.id] || [] }))
        .filter((b: Bundle) => {
          if (b.products.length < 2) return false;
          if (currentProductId) return b.products.some((p) => p.id === currentProductId);
          return true;
        });
    },
  });

  if (bundles.length === 0) return null;

  const handleAddBundle = async (bundle: Bundle) => {
    if (!user) { toast({ title: "Sign in to add to cart", variant: "destructive" }); return; }
    const hasCustom = bundle.products.some((p) => p.product_type === "custom");
    if (hasCustom && !subscribed && !isAdmin) {
      toast({ title: "Members only", description: "This bundle contains exclusive items.", variant: "destructive" });
      return;
    }
    for (const p of bundle.products) {
      await addToCart(p.id);
    }
    toast({ title: `${bundle.name} added to cart — ${bundle.discount_percentage}% off!` });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
        <Package className="h-5 w-5 text-gold" /> Bundle & Save
      </h3>
      <div className="grid gap-4 md:grid-cols-2">
        {bundles.map((bundle: Bundle) => {
          const originalTotal = bundle.products.reduce((a, p) => a + p.price, 0);
          const bundlePrice = originalTotal * (1 - bundle.discount_percentage / 100);
          const hasCustom = bundle.products.some((p) => p.product_type === "custom");
          const premiumRequired = hasCustom && !subscribed && !isAdmin;

          return (
            <motion.div
              key={bundle.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-gold/20 bg-card p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-display text-sm font-bold text-foreground">{bundle.name}</h4>
                  <p className="font-body text-xs text-muted-foreground">{bundle.description}</p>
                </div>
                <Badge className="bg-gold text-primary-foreground font-body text-[10px]">
                  {bundle.discount_percentage}% OFF
                </Badge>
              </div>

              <div className="flex gap-2 overflow-x-auto">
                {bundle.products.map((p) => (
                  <Link key={p.id} to={`/shop/${p.id}`} className="flex-shrink-0">
                    <div className="h-16 w-16 overflow-hidden rounded border border-border">
                      <img src={p.images[0] || "/placeholder.svg"} alt={p.name} className="h-full w-full object-cover" />
                    </div>
                    <p className="mt-1 font-body text-[10px] text-muted-foreground line-clamp-1 w-16">{p.name}</p>
                  </Link>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-lg font-bold text-gold">${bundlePrice.toFixed(2)}</span>
                  <span className="font-body text-xs text-muted-foreground line-through">${originalTotal.toFixed(2)}</span>
                </div>
                {premiumRequired ? (
                  <Button size="sm" asChild className="bg-gold hover:bg-gold/90">
                    <Link to="/membership"><Crown className="mr-1 h-3 w-3" /> Members Only</Link>
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => handleAddBundle(bundle)}>
                    <ShoppingBag className="mr-1 h-3 w-3" /> Add Bundle
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductBundles;
