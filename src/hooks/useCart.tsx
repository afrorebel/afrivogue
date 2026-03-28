import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  size?: string;
  color?: string;
  product?: {
    id: string;
    name: string;
    price: number;
    flash_sale: boolean;
    flash_sale_price: number | null;
    flash_sale_end: string | null;
    images: string[];
    product_type: string;
    affiliate_url: string | null;
    stock: number;
  };
}

interface CartContextType {
  items: CartItem[];
  count: number;
  total: number;
  loading: boolean;
  addToCart: (productId: string, quantity?: number, size?: string, color?: string) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from("cart_items")
      .select("*, product:products(*)")
      .eq("user_id", user.id);
    setItems(
      (data || []).map((d: any) => ({
        ...d,
        product: d.product ? { ...d.product, images: d.product.images || [] } : undefined,
      }))
    );
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = async (productId: string, quantity = 1, size?: string, color?: string) => {
    if (!user) return;
    const existing = items.find((i) => i.product_id === productId && i.size === size && i.color === color);
    if (existing) {
      await supabase.from("cart_items").update({ quantity: existing.quantity + quantity }).eq("id", existing.id);
    } else {
      await supabase.from("cart_items").insert({ user_id: user.id, product_id: productId, quantity, size, color });
    }
    await fetchCart();
  };

  const removeFromCart = async (itemId: string) => {
    await supabase.from("cart_items").delete().eq("id", itemId);
    await fetchCart();
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) return removeFromCart(itemId);
    await supabase.from("cart_items").update({ quantity }).eq("id", itemId);
    await fetchCart();
  };

  const clearCart = async () => {
    if (!user) return;
    await supabase.from("cart_items").delete().eq("user_id", user.id);
    setItems([]);
  };

  const getEffectivePrice = (p: CartItem["product"]) => {
    if (!p) return 0;
    if (p.flash_sale && p.flash_sale_price && p.flash_sale_end && new Date(p.flash_sale_end) > new Date()) {
      return p.flash_sale_price;
    }
    return p.price;
  };

  const count = items.reduce((a, i) => a + i.quantity, 0);
  const total = items.reduce((a, i) => a + i.quantity * getEffectivePrice(i.product), 0);

  return (
    <CartContext.Provider value={{ items, count, total, loading, addToCart, removeFromCart, updateQuantity, clearCart, refresh: fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
