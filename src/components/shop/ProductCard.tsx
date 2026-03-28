import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, ExternalLink, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface Product {
  id: string;
  name: string;
  price: number;
  compare_at_price?: number | null;
  category: string;
  product_type: string;
  affiliate_url?: string | null;
  images: string[];
  stock: number;
  featured: boolean;
  flash_sale: boolean;
  flash_sale_end?: string | null;
  flash_sale_price?: number | null;
}

interface Props {
  product: Product;
  isWishlisted?: boolean;
  onWishlistToggle?: () => void;
}

const CountdownTimer = ({ endDate }: { endDate: string }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useState(() => {
    const update = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Ended"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  });

  return (
    <div className="flex items-center gap-1 rounded-sm bg-destructive px-2 py-1 text-destructive-foreground">
      <Clock className="h-3 w-3" />
      <span className="font-body text-[10px] font-bold uppercase tracking-wider">{timeLeft}</span>
    </div>
  );
};

const ProductCard = ({ product, isWishlisted, onWishlistToggle }: Props) => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const isFlashActive = product.flash_sale && product.flash_sale_end && new Date(product.flash_sale_end) > new Date();
  const effectivePrice = isFlashActive && product.flash_sale_price ? product.flash_sale_price : product.price;
  const showCompare = product.compare_at_price && product.compare_at_price > effectivePrice;
  const isAffiliate = product.product_type === "affiliate";
  const outOfStock = product.stock <= 0 && !isAffiliate;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast({ title: "Sign in to add to cart", variant: "destructive" }); return; }
    await addToCart(product.id);
    toast({ title: `${product.name} added to cart` });
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast({ title: "Sign in to save items", variant: "destructive" }); return; }
    if (isWishlisted) {
      await supabase.from("wishlists").delete().eq("user_id", user.id).eq("product_id", product.id);
    } else {
      await supabase.from("wishlists").insert({ user_id: user.id, product_id: product.id });
    }
    onWishlistToggle?.();
  };

  const img = product.images?.[0] || "/placeholder.svg";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-lg border border-border bg-card"
    >
      <Link to={isAffiliate && product.affiliate_url ? product.affiliate_url : `/shop/${product.id}`} target={isAffiliate ? "_blank" : undefined}>
        <div className="relative aspect-[3/4] overflow-hidden">
          <img src={img} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />

          {/* Badges */}
          <div className="absolute left-3 top-3 flex flex-col gap-1">
            {product.featured && <Badge className="bg-gold text-primary-foreground font-body text-[10px]">Featured</Badge>}
            {isFlashActive && <CountdownTimer endDate={product.flash_sale_end!} />}
            {isAffiliate && (
              <Badge variant="secondary" className="font-body text-[10px]">
                <ExternalLink className="mr-1 h-3 w-3" /> Affiliate
              </Badge>
            )}
            {outOfStock && <Badge variant="destructive" className="font-body text-[10px]">Out of stock</Badge>}
            {showCompare && (
              <Badge className="bg-destructive text-destructive-foreground font-body text-[10px]">
                {Math.round((1 - effectivePrice / product.compare_at_price!) * 100)}% OFF
              </Badge>
            )}
          </div>

          {/* Quick actions */}
          <div className="absolute right-3 top-3 flex flex-col gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full" onClick={handleWishlist}>
              <Heart className={`h-4 w-4 ${isWishlisted ? "fill-destructive text-destructive" : ""}`} />
            </Button>
            {!isAffiliate && !outOfStock && (
              <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full" onClick={handleAddToCart}>
                <ShoppingBag className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="p-4">
          <p className="font-body text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{product.category}</p>
          <h3 className="mt-1 font-display text-sm font-semibold text-foreground line-clamp-2">{product.name}</h3>
          <div className="mt-2 flex items-center gap-2">
            <span className="font-display text-lg font-bold text-gold">${effectivePrice.toFixed(2)}</span>
            {(showCompare || isFlashActive) && (
              <span className="font-body text-xs text-muted-foreground line-through">
                ${(product.compare_at_price || product.price).toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
