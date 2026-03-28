import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "./ProductCard";
import { Sparkles } from "lucide-react";

const CrossSellProducts = ({ productId, category }: { productId: string; category: string }) => {
  const { data: crossSell = [] } = useQuery({
    queryKey: ["cross-sell", productId],
    queryFn: async () => {
      // First try explicit cross-sell rules
      const { data: rules } = await supabase
        .from("cross_sell_rules")
        .select("recommended_product_id")
        .eq("source_product_id", productId)
        .order("priority", { ascending: false })
        .limit(4);

      if (rules && rules.length > 0) {
        const ids = rules.map((r: any) => r.recommended_product_id);
        const { data: products } = await supabase
          .from("products")
          .select("*")
          .eq("published", true)
          .in("id", ids);
        return (products || []).map((p: any) => ({ ...p, images: (p.images as string[]) || [] }));
      }

      // Fallback: same category products
      const { data: products } = await supabase
        .from("products")
        .select("*")
        .eq("published", true)
        .eq("category", category)
        .neq("id", productId)
        .limit(4);
      return (products || []).map((p: any) => ({ ...p, images: (p.images as string[]) || [] }));
    },
    enabled: !!productId,
  });

  if (crossSell.length === 0) return null;

  return (
    <div className="mt-16">
      <h2 className="mb-6 font-display text-xl font-bold text-foreground flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-gold" /> Complete Your Look
      </h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {crossSell.map((p: any) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
};

export default CrossSellProducts;
