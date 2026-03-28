import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

const FeaturedProducts = () => {
  const { data: products = [] } = useQuery({
    queryKey: ["featured-products-home"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("published", true)
        .eq("featured", true)
        .order("created_at", { ascending: false })
        .limit(4);
      return (data || []).map((p: any) => ({ ...p, images: (p.images as string[]) || [] }));
    },
  });

  if (products.length === 0) return null;

  return (
    <section className="py-16 px-6 md:px-16 lg:px-24">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="font-body text-xs uppercase tracking-[0.2em] text-gold">The Collection</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-foreground md:text-3xl">Shop the Edit</h2>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/shop">View All <ArrowRight className="ml-1 h-3 w-3" /></Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {products.map((p: any, i: number) => {
          const isFlash = p.flash_sale && p.flash_sale_end && new Date(p.flash_sale_end) > new Date();
          const price = isFlash && p.flash_sale_price ? p.flash_sale_price : p.price;
          const img = p.images[0] || "/placeholder.svg";

          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link to={`/shop/${p.id}`} className="group block overflow-hidden rounded-lg border border-border bg-card">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img src={img} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute left-2 top-2 flex flex-col gap-1">
                    {p.product_type === "custom" && (
                      <Badge className="bg-gold text-primary-foreground font-body text-[10px]">
                        <ShoppingBag className="mr-1 h-3 w-3" /> Exclusive
                      </Badge>
                    )}
                    {isFlash && (
                      <Badge className="bg-destructive text-destructive-foreground font-body text-[10px]">Flash Sale</Badge>
                    )}
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-body text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{p.category}</p>
                  <h3 className="mt-0.5 font-display text-sm font-semibold text-foreground line-clamp-1">{p.name}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-display text-base font-bold text-gold">${Number(price).toFixed(2)}</span>
                    {p.compare_at_price && p.compare_at_price > price && (
                      <span className="font-body text-xs text-muted-foreground line-through">${Number(p.compare_at_price).toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default FeaturedProducts;
