import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { items, discount_code } = await req.json();
    if (!items || !Array.isArray(items) || items.length === 0) throw new Error("No items provided");

    // Fetch products from DB
    const productIds = items.map((i: any) => i.product_id);
    const { data: products, error: prodError } = await supabaseClient
      .from("products")
      .select("*")
      .in("id", productIds)
      .eq("published", true);
    if (prodError) throw prodError;

    // Build line items
    const lineItems: any[] = [];
    let subtotal = 0;
    for (const item of items) {
      const product = products?.find((p: any) => p.id === item.product_id);
      if (!product) continue;
      if (product.product_type !== "custom") continue;

      let price = product.price;
      if (product.flash_sale && product.flash_sale_price && product.flash_sale_end && new Date(product.flash_sale_end) > new Date()) {
        price = product.flash_sale_price;
      }

      subtotal += price * (item.quantity || 1);

      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            description: [item.size && `Size: ${item.size}`, item.color && `Color: ${item.color}`].filter(Boolean).join(", ") || undefined,
            images: product.images?.[0] ? [product.images[0]] : undefined,
          },
          unit_amount: Math.round(price * 100),
        },
        quantity: item.quantity || 1,
      });
    }

    if (lineItems.length === 0) throw new Error("No valid items");

    // Apply discount
    const discounts: any[] = [];
    if (discount_code) {
      const { data: dc } = await supabaseClient
        .from("discount_codes")
        .select("*")
        .eq("code", discount_code)
        .eq("active", true)
        .maybeSingle();
      if (dc) {
        // We'll create a Stripe coupon on the fly
        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
        const coupon = await stripe.coupons.create(
          dc.discount_type === "percentage"
            ? { percent_off: dc.discount_value, duration: "once" }
            : { amount_off: Math.round(dc.discount_value * 100), currency: "usd", duration: "once" }
        );
        discounts.push({ coupon: coupon.id });

        // Increment usage
        await supabaseClient
          .from("discount_codes")
          .update({ times_used: (dc.times_used || 0) + 1 })
          .eq("id", dc.id);
      }
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) customerId = customers.data[0].id;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: lineItems,
      discounts: discounts.length > 0 ? discounts : undefined,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/shop?checkout=success`,
      cancel_url: `${req.headers.get("origin")}/shop`,
      metadata: { user_id: user.id },
    });

    // Create order record
    await supabaseClient.from("orders").insert({
      user_id: user.id,
      items: items,
      total: subtotal,
      status: "pending",
      stripe_session_id: session.id,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
