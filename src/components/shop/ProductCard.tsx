import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, ExternalLink, Clock, Crown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { categoryColor } from "@/lib/categoryColors";

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

  useEffect(() => {
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
  }, [endDate]);

  return (
    <div className="flex items-center gap-1 rounded-full bg-destructive px-2.5 py-1 text-destructive-foreground shadow-sm">
      <Clock className="h-3 w-3" />
      <span className="font-body text-[8px] font-bold uppercase tracking-[0.2em]">{timeLeft}</span>
    </div>
  );
};

const ProductCard = ({ product, isWishlisted, onWishlistToggle }: Props) => {
  const { user, subscribed, isAdmin } = useAuth();
  const { addToCart } = useCart();
  const isFlashActive = product.flash_sale && product.flash_sale_end && new Date(product.flash_sale_end) > new Date();
  const effectivePrice = isFlashActive && product.flash_sale_price ? product.flash_sale_price : product.price;
  const showCompare = product.compare_at_price && product.compare_at_price > effectivePrice;
  const isAffiliate = product.product_type === "affiliate";
  const isCustom = product.product_type === "custom";
  const premiumRequired = isCustom && !subscribed && !isAdmin;
  const outOfStock = product.stock <= 0 && !isAffiliate;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast({ title: "Sign in to add to cart", variant: "destructive" }); return; }
    if (premiumRequired) { toast({ title: "Members only", description: "Custom pieces are exclusive to Collective members.", variant: "destructive" }); return; }
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
  const badge = "rounded-full px-2.5 py-1 font-body text-[9px] font-bold uppercase tracking-[0.14em] shadow-sm";
  const linkProps =
    isAffiliate && product.affiliate_url
      ? { href: product.affiliate_url, target: "_blank", rel: "noopener noreferrer sponsored" }
      : null;

  const body = (
    <>
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-surface shadow-soft transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-lift">
        <img
          src={img}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            if (!e.currentTarget.src.endsWith("/placeholder.svg")) e.currentTarget.src = "/placeholder.svg";
          }}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1">
          {isCustom && (
            <span className={`${badge} flex items-center gap-1 bg-gold text-primary-foreground`}>
              <Crown className="h-3 w-3" /> Members
            </span>
          )}
          {product.featured && !isCustom && <span className={`${badge} bg-gold text-primary-foreground`}>Featured</span>}
          {isFlashActive && <CountdownTimer endDate={product.flash_sale_end!} />}
          {isAffiliate && (
            <span className={`${badge} flex items-center gap-1 bg-white/90 text-neutral-900 backdrop-blur-sm`}>
              <ExternalLink className="h-3 w-3" /> Partner
            </span>
          )}
          {outOfStock && <span className={`${badge} bg-destructive text-destructive-foreground`}>Sold Out</span>}
          {showCompare && (
            <span className={`${badge} bg-destructive text-destructive-foreground`}>
              {Math.round((1 - effectivePrice / product.compare_at_price!) * 100)}% Off
            </span>
          )}
        </div>

        {/* Quick actions — always visible on touch screens, revealed on hover on desktop */}
        <div className="absolute right-3 top-3 flex flex-col gap-2 transition-opacity md:opacity-0 md:group-hover:opacity-100">
          <button
            type="button"
            aria-label={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
            onClick={handleWishlist}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-soft backdrop-blur-sm transition-transform hover:scale-110"
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? "fill-destructive text-destructive" : ""}`} />
          </button>
          {!isAffiliate && !outOfStock && !premiumRequired && (
            <button
              type="button"
              aria-label="Add to cart"
              onClick={handleAddToCart}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-soft backdrop-blur-sm transition-transform hover:scale-110"
            >
              <ShoppingBag className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <p className="mt-3.5 px-1 font-body text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: categoryColor(product.category) }}>{product.category}</p>
      <h3 className="mt-1.5 px-1 font-display text-lg leading-snug text-foreground transition-colors line-clamp-2 group-hover:text-gold">
        {product.name}
      </h3>
      <div className="mt-1.5 flex items-center gap-2.5 px-1">
        <span className="font-body text-sm font-semibold text-foreground">${effectivePrice.toFixed(2)}</span>
        {(showCompare || isFlashActive) && (
          <span className="font-body text-xs text-muted-foreground line-through">
            ${(product.compare_at_price || product.price).toFixed(2)}
          </span>
        )}
      </div>
    </>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="group relative min-w-0">
      {linkProps ? (
        <a {...linkProps} className="block">{body}</a>
      ) : (
        <Link to={`/shop/${product.id}`} className="block">{body}</Link>
      )}
    </motion.div>
  );
};

export default ProductCard;
