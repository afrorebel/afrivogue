import { ShoppingBag, Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { Input } from "@/components/ui/input";

const CartDrawer = () => {
  const { items, count, total, removeFromCart, updateQuantity, clearCart } = useCart();
  const { user } = useAuth();
  const [discountCode, setDiscountCode] = useState("");
  const [discount, setDiscount] = useState<{ type: string; value: number } | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  const applyDiscount = async () => {
    const { data } = await supabase
      .from("discount_codes")
      .select("*")
      .eq("code", discountCode.toUpperCase())
      .eq("active", true)
      .maybeSingle();
    if (!data) { toast({ title: "Invalid code", variant: "destructive" }); return; }
    if (data.expires_at && new Date(data.expires_at) < new Date()) { toast({ title: "Code expired", variant: "destructive" }); return; }
    if (data.max_uses && data.times_used >= data.max_uses) { toast({ title: "Code fully redeemed", variant: "destructive" }); return; }
    if (data.min_order && total < Number(data.min_order)) { toast({ title: `Minimum order $${data.min_order}`, variant: "destructive" }); return; }
    setDiscount({ type: data.discount_type, value: Number(data.discount_value) });
    toast({ title: `Code applied: ${discountCode.toUpperCase()}` });
  };

  const discountAmount = discount
    ? discount.type === "percentage" ? total * (discount.value / 100) : discount.value
    : 0;
  const finalTotal = Math.max(0, total - discountAmount);

  const handleCheckout = async () => {
    if (!user) { toast({ title: "Sign in to checkout", variant: "destructive" }); return; }
    const customItems = items.filter((i) => i.product?.product_type === "custom");
    if (customItems.length === 0) { toast({ title: "No purchasable items in cart" }); return; }
    setCheckingOut(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-shop-checkout", {
        body: {
          items: customItems.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
            size: i.size,
            color: i.color,
          })),
          discount_code: discount ? discountCode.toUpperCase() : undefined,
        },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (e: any) {
      toast({ title: "Checkout failed", description: e.message, variant: "destructive" });
    }
    setCheckingOut(false);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingBag className="h-5 w-5" />
          {count > 0 && (
            <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold p-0 text-[10px] text-primary-foreground">
              {count}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-display">Shopping Bag ({count})</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="font-body text-sm text-muted-foreground">Your bag is empty</p>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto py-4">
              {items.map((item) => {
                const img = item.product?.images?.[0] || "/placeholder.svg";
                const price = item.product?.flash_sale && item.product.flash_sale_price && item.product.flash_sale_end && new Date(item.product.flash_sale_end) > new Date()
                  ? item.product.flash_sale_price : (item.product?.price || 0);
                return (
                  <div key={item.id} className="flex gap-3 rounded-lg border border-border p-3">
                    <img src={img} alt={item.product?.name} className="h-20 w-16 rounded object-cover" />
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <p className="font-body text-xs font-medium text-foreground line-clamp-1">{item.product?.name}</p>
                        {(item.size || item.color) && (
                          <p className="font-body text-[10px] text-muted-foreground">
                            {item.size && `Size: ${item.size}`} {item.color && `Color: ${item.color}`}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="font-body text-xs w-6 text-center">{item.quantity}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="font-display text-sm font-bold text-gold">${(price * item.quantity).toFixed(2)}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeFromCart(item.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3 border-t border-border pt-4">
              {/* Discount code */}
              <div className="flex gap-2">
                <Input placeholder="Discount code" value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} className="font-body text-xs" />
                <Button variant="outline" size="sm" onClick={applyDiscount}>Apply</Button>
              </div>
              {discount && (
                <div className="flex justify-between font-body text-xs text-muted-foreground">
                  <span>Discount</span>
                  <span className="text-destructive">-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-body text-sm text-foreground">Total</span>
                <span className="font-display text-lg font-bold text-gold">${finalTotal.toFixed(2)}</span>
              </div>
              <Button className="w-full" onClick={handleCheckout} disabled={checkingOut}>
                {checkingOut ? "Processing…" : "Checkout"} <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={clearCart}>
                Clear bag
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
