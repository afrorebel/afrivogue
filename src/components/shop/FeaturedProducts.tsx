import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
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
    <section className="px-6 py-24 md:px-12 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 flex items-end justify-between border-b border-border/60 pb-4">
          <div>
            <p className="font-body text-[9px] uppercase tracking-[0.4em] text-gold">The Collection</p>
            <h2 className="mt-3 font-display text-3xl italic text-foreground md:text-5xl">Shop the Edit</h2>
          </div>
          <Link
            to="/shop"
            className="border-b border-border pb-1 font-body text-[10px] uppercase tracking-[0.3em] text-foreground transition-colors hover:border-gold hover:text-gold"
          >
            View All
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4">
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
                transition={{ delay: i * 0.08 }}
              >
                <Link to={`/shop/${p.id}`} className="group block">
                  <div className="relative aspect-[3/4] overflow-hidden bg-surface">
                    <img
                      src={img}
                      alt={p.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                    />
                    <div className="absolute left-3 top-3 flex flex-col gap-1">
                      {p.product_type === "custom" && (
                        <span className="bg-gold px-2 py-1 font-body text-[8px] font-bold uppercase tracking-[0.2em] text-primary-foreground">
                          Exclusive
                        </span>
                      )}
                      {isFlash && (
                        <span className="bg-destructive px-2 py-1 font-body text-[8px] font-bold uppercase tracking-[0.2em] text-destructive-foreground">
                          Flash Sale
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="mt-4 font-body text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
                    {p.category}
                  </p>
                  <h3 className="mt-2 font-display text-lg italic leading-tight text-foreground transition-colors group-hover:text-gold">
                    {p.name}
                  </h3>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="font-body text-xs tracking-[0.15em] text-gold">${Number(price).toFixed(2)}</span>
                    {p.compare_at_price && p.compare_at_price > price && (
                      <span className="font-body text-xs text-muted-foreground line-through">
                        ${Number(p.compare_at_price).toFixed(2)}
                      </span>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );

    </section>
  );
};

export default FeaturedProducts;
