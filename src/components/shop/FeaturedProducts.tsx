import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SectionHeader from "@/components/editorial/SectionHeader";
import ProductCard from "@/components/shop/ProductCard";

/** "Shop the Edit" strip of featured products, shown on editorial pages. */
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
    <section className="mx-auto max-w-[1440px] pt-16 md:pt-24">
      <SectionHeader eyebrow="The collection" title="Shop the Edit" link={{ to: "/shop", label: "Visit the shop" }} />
      <div className={`grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 ${products.length >= 4 ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
        {products.map((p: any) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
};

export default FeaturedProducts;
