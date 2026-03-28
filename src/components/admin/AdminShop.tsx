import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Package, Tag, ShoppingCart, Zap } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";
import ImageUpload from "@/components/shop/ImageUpload";

const CATEGORIES = ["Fashion", "Beauty", "Luxury", "Art & Design", "Culture", "Accessories"];

interface ProductForm {
  name: string;
  description: string;
  price: string;
  compare_at_price: string;
  category: string;
  product_type: string;
  affiliate_url: string;
  images: string[];
  stock: string;
  sizes: string;
  colors: string;
  tags: string;
  featured: boolean;
  published: boolean;
  flash_sale: boolean;
  flash_sale_end: string;
  flash_sale_price: string;
}

const emptyForm: ProductForm = {
  name: "", description: "", price: "0", compare_at_price: "", category: "Fashion",
  product_type: "custom", affiliate_url: "", images: [], stock: "0", sizes: "",
  colors: "", tags: "", featured: false, published: false, flash_sale: false,
  flash_sale_end: "", flash_sale_price: "",
};

interface DiscountForm {
  code: string;
  discount_type: string;
  discount_value: string;
  min_order: string;
  max_uses: string;
  active: boolean;
  expires_at: string;
}

const emptyDiscount: DiscountForm = {
  code: "", discount_type: "percentage", discount_value: "0", min_order: "", max_uses: "", active: true, expires_at: "",
};

const AdminShop = () => {
  const qc = useQueryClient();
  const [productForm, setProductForm] = useState<ProductForm>(emptyForm);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [discountForm, setDiscountForm] = useState<DiscountForm>(emptyDiscount);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: discounts = [] } = useQuery({
    queryKey: ["admin-discounts"],
    queryFn: async () => {
      const { data } = await supabase.from("discount_codes").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const saveProd = useMutation({
    mutationFn: async () => {
      const payload = {
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price) || 0,
        compare_at_price: productForm.compare_at_price ? parseFloat(productForm.compare_at_price) : null,
        category: productForm.category,
        product_type: productForm.product_type,
        affiliate_url: productForm.affiliate_url || null,
        images: productForm.images as unknown as Json,
        stock: parseInt(productForm.stock) || 0,
        sizes: productForm.sizes.split(",").map((s) => s.trim()).filter(Boolean) as unknown as Json,
        colors: productForm.colors.split(",").map((s) => s.trim()).filter(Boolean) as unknown as Json,
        tags: productForm.tags.split(",").map((s) => s.trim()).filter(Boolean) as unknown as Json,
        featured: productForm.featured,
        published: productForm.published,
        flash_sale: productForm.flash_sale,
        flash_sale_end: productForm.flash_sale_end || null,
        flash_sale_price: productForm.flash_sale_price ? parseFloat(productForm.flash_sale_price) : null,
      };
      if (editingProduct) {
        const { error } = await supabase.from("products").update(payload).eq("id", editingProduct);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: editingProduct ? "Product updated" : "Product created" });
      setProductDialogOpen(false);
      setProductForm(emptyForm);
      setEditingProduct(null);
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteProd = async (id: string) => {
    await supabase.from("products").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    toast({ title: "Product deleted" });
  };

  const saveDiscount = useMutation({
    mutationFn: async () => {
      const payload = {
        code: discountForm.code.toUpperCase(),
        discount_type: discountForm.discount_type,
        discount_value: parseFloat(discountForm.discount_value) || 0,
        min_order: discountForm.min_order ? parseFloat(discountForm.min_order) : 0,
        max_uses: discountForm.max_uses ? parseInt(discountForm.max_uses) : null,
        active: discountForm.active,
        expires_at: discountForm.expires_at || null,
      };
      const { error } = await supabase.from("discount_codes").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-discounts"] });
      toast({ title: "Discount code created" });
      setDiscountDialogOpen(false);
      setDiscountForm(emptyDiscount);
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateOrderStatus = async (id: string, status: string) => {
    await supabase.from("orders").update({ status }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
    toast({ title: `Order marked as ${status}` });
  };

  const editProduct = (p: any) => {
    setEditingProduct(p.id);
    setProductForm({
      name: p.name, description: p.description, price: String(p.price),
      compare_at_price: p.compare_at_price ? String(p.compare_at_price) : "",
      category: p.category, product_type: p.product_type,
      affiliate_url: p.affiliate_url || "", images: (p.images as string[]) || [],
      stock: String(p.stock), sizes: ((p.sizes as string[]) || []).join(", "),
      colors: ((p.colors as string[]) || []).join(", "),
      tags: ((p.tags as string[]) || []).join(", "),
      featured: p.featured, published: p.published, flash_sale: p.flash_sale,
      flash_sale_end: p.flash_sale_end ? new Date(p.flash_sale_end).toISOString().slice(0, 16) : "",
      flash_sale_price: p.flash_sale_price ? String(p.flash_sale_price) : "",
    });
    setProductDialogOpen(true);
  };

  return (
    <Tabs defaultValue="products">
      <TabsList className="mb-4">
        <TabsTrigger value="products"><Package className="mr-1 h-4 w-4" /> Products</TabsTrigger>
        <TabsTrigger value="orders"><ShoppingCart className="mr-1 h-4 w-4" /> Orders</TabsTrigger>
        <TabsTrigger value="discounts"><Tag className="mr-1 h-4 w-4" /> Discounts</TabsTrigger>
        <TabsTrigger value="flash"><Zap className="mr-1 h-4 w-4" /> Flash Sales</TabsTrigger>
      </TabsList>

      {/* PRODUCTS */}
      <TabsContent value="products">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold">Products ({products.length})</h3>
          <Dialog open={productDialogOpen} onOpenChange={(o) => { setProductDialogOpen(o); if (!o) { setEditingProduct(null); setProductForm(emptyForm); } }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-1 h-4 w-4" /> Add Product</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
              <DialogHeader><DialogTitle className="font-display">{editingProduct ? "Edit" : "New"} Product</DialogTitle></DialogHeader>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Name</Label>
                  <Input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} rows={3} />
                </div>
                <div className="space-y-2"><Label>Price ($)</Label><Input type="number" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} /></div>
                <div className="space-y-2"><Label>Compare-at Price</Label><Input type="number" value={productForm.compare_at_price} onChange={(e) => setProductForm({ ...productForm, compare_at_price: e.target.value })} /></div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={productForm.category} onValueChange={(v) => setProductForm({ ...productForm, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={productForm.product_type} onValueChange={(v) => setProductForm({ ...productForm, product_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="custom">Custom</SelectItem><SelectItem value="affiliate">Affiliate</SelectItem></SelectContent>
                  </Select>
                </div>
                {productForm.product_type === "affiliate" && (
                  <div className="space-y-2 md:col-span-2"><Label>Affiliate URL</Label><Input value={productForm.affiliate_url} onChange={(e) => setProductForm({ ...productForm, affiliate_url: e.target.value })} /></div>
                )}
                <div className="space-y-2"><Label>Stock</Label><Input type="number" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} /></div>
                <div className="space-y-2"><Label>Sizes (comma-separated)</Label><Input value={productForm.sizes} onChange={(e) => setProductForm({ ...productForm, sizes: e.target.value })} placeholder="S, M, L, XL" /></div>
                <div className="space-y-2"><Label>Colors (comma-separated)</Label><Input value={productForm.colors} onChange={(e) => setProductForm({ ...productForm, colors: e.target.value })} placeholder="Black, White, Gold" /></div>
                <div className="space-y-2"><Label>Tags (comma-separated)</Label><Input value={productForm.tags} onChange={(e) => setProductForm({ ...productForm, tags: e.target.value })} /></div>
                <div className="md:col-span-2">
                  <ImageUpload
                    bucket="product-images"
                    folder="products"
                    value={productForm.images}
                    onChange={(urls) => setProductForm({ ...productForm, images: urls })}
                    label="Product Images"
                  />
                </div>
                <div className="flex items-center gap-3"><Switch checked={productForm.published} onCheckedChange={(v) => setProductForm({ ...productForm, published: v })} /><Label>Published</Label></div>
                <div className="flex items-center gap-3"><Switch checked={productForm.featured} onCheckedChange={(v) => setProductForm({ ...productForm, featured: v })} /><Label>Featured</Label></div>
                {/* Flash sale fields */}
                <div className="md:col-span-2 border-t border-border pt-4 space-y-3">
                  <div className="flex items-center gap-3"><Switch checked={productForm.flash_sale} onCheckedChange={(v) => setProductForm({ ...productForm, flash_sale: v })} /><Label>Flash Sale</Label></div>
                  {productForm.flash_sale && (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1"><Label>Sale Price</Label><Input type="number" value={productForm.flash_sale_price} onChange={(e) => setProductForm({ ...productForm, flash_sale_price: e.target.value })} /></div>
                      <div className="space-y-1"><Label>Ends At</Label><Input type="datetime-local" value={productForm.flash_sale_end} onChange={(e) => setProductForm({ ...productForm, flash_sale_end: e.target.value })} /></div>
                    </div>
                  )}
                </div>
              </div>
              <Button onClick={() => saveProd.mutate()} disabled={saveProd.isPending} className="mt-4 w-full">
                {editingProduct ? "Update" : "Create"} Product
              </Button>
            </DialogContent>
          </Dialog>
        </div>
        <Table>
          <TableHeader><TableRow>
            <TableHead>Product</TableHead><TableHead>Type</TableHead><TableHead>Price</TableHead><TableHead>Stock</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {products.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {(p.images as string[])?.[0] && <img src={(p.images as string[])[0]} className="h-10 w-10 rounded object-cover" />}
                    <div>
                      <p className="font-body text-xs font-medium">{p.name}</p>
                      <p className="font-body text-[10px] text-muted-foreground">{p.category}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell><Badge variant={p.product_type === "custom" ? "default" : "secondary"} className="font-body text-[10px]">{p.product_type}</Badge></TableCell>
                <TableCell className="font-body text-xs">${Number(p.price).toFixed(2)}{p.flash_sale && <span className="ml-1 text-destructive">⚡</span>}</TableCell>
                <TableCell className="font-body text-xs">{p.stock}</TableCell>
                <TableCell><Badge variant={p.published ? "default" : "outline"} className="font-body text-[10px]">{p.published ? "Live" : "Draft"}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => editProduct(p)}><Pencil className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteProd(p.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabsContent>

      {/* ORDERS */}
      <TabsContent value="orders">
        <h3 className="font-display text-lg font-bold mb-4">Orders ({orders.length})</h3>
        <Table>
          <TableHeader><TableRow>
            <TableHead>Order</TableHead><TableHead>Items</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead>Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {orders.map((o: any) => (
              <TableRow key={o.id}>
                <TableCell className="font-body text-xs font-mono">{o.id.slice(0, 8)}…</TableCell>
                <TableCell className="font-body text-xs">{((o.items as any[]) || []).length} items</TableCell>
                <TableCell className="font-body text-xs font-bold">${Number(o.total).toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={o.status === "paid" ? "default" : o.status === "shipped" ? "secondary" : "outline"} className="font-body text-[10px]">
                    {o.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-body text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Select value={o.status} onValueChange={(v) => updateOrderStatus(o.id, v)}>
                    <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabsContent>

      {/* DISCOUNTS */}
      <TabsContent value="discounts">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold">Discount Codes ({discounts.length})</h3>
          <Dialog open={discountDialogOpen} onOpenChange={setDiscountDialogOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-4 w-4" /> Add Code</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">New Discount Code</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1"><Label>Code</Label><Input value={discountForm.code} onChange={(e) => setDiscountForm({ ...discountForm, code: e.target.value })} placeholder="SUMMER25" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Type</Label>
                    <Select value={discountForm.discount_type} onValueChange={(v) => setDiscountForm({ ...discountForm, discount_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="percentage">Percentage</SelectItem><SelectItem value="fixed">Fixed Amount</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label>Value</Label><Input type="number" value={discountForm.discount_value} onChange={(e) => setDiscountForm({ ...discountForm, discount_value: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Min Order ($)</Label><Input type="number" value={discountForm.min_order} onChange={(e) => setDiscountForm({ ...discountForm, min_order: e.target.value })} /></div>
                  <div className="space-y-1"><Label>Max Uses</Label><Input type="number" value={discountForm.max_uses} onChange={(e) => setDiscountForm({ ...discountForm, max_uses: e.target.value })} placeholder="Unlimited" /></div>
                </div>
                <div className="space-y-1"><Label>Expires At</Label><Input type="datetime-local" value={discountForm.expires_at} onChange={(e) => setDiscountForm({ ...discountForm, expires_at: e.target.value })} /></div>
                <div className="flex items-center gap-3"><Switch checked={discountForm.active} onCheckedChange={(v) => setDiscountForm({ ...discountForm, active: v })} /><Label>Active</Label></div>
              </div>
              <Button onClick={() => saveDiscount.mutate()} disabled={saveDiscount.isPending} className="mt-3 w-full">Create Code</Button>
            </DialogContent>
          </Dialog>
        </div>
        <Table>
          <TableHeader><TableRow>
            <TableHead>Code</TableHead><TableHead>Discount</TableHead><TableHead>Min Order</TableHead><TableHead>Uses</TableHead><TableHead>Status</TableHead><TableHead>Expires</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {discounts.map((d: any) => (
              <TableRow key={d.id}>
                <TableCell className="font-mono font-bold text-xs">{d.code}</TableCell>
                <TableCell className="font-body text-xs">{d.discount_type === "percentage" ? `${d.discount_value}%` : `$${Number(d.discount_value).toFixed(2)}`}</TableCell>
                <TableCell className="font-body text-xs">{d.min_order ? `$${Number(d.min_order).toFixed(2)}` : "—"}</TableCell>
                <TableCell className="font-body text-xs">{d.times_used}{d.max_uses ? `/${d.max_uses}` : ""}</TableCell>
                <TableCell><Badge variant={d.active ? "default" : "outline"} className="text-[10px]">{d.active ? "Active" : "Inactive"}</Badge></TableCell>
                <TableCell className="font-body text-xs text-muted-foreground">{d.expires_at ? new Date(d.expires_at).toLocaleDateString() : "Never"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabsContent>

      {/* FLASH SALES */}
      <TabsContent value="flash">
        <Card>
          <CardHeader><CardTitle className="font-display text-lg flex items-center gap-2"><Zap className="h-4 w-4 text-gold" /> Active Flash Sales</CardTitle></CardHeader>
          <CardContent>
            <p className="font-body text-sm text-muted-foreground mb-4">Flash sales are managed per product. Edit a product and toggle "Flash Sale" to set a sale price and countdown timer.</p>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Product</TableHead><TableHead>Original</TableHead><TableHead>Sale Price</TableHead><TableHead>Ends</TableHead><TableHead>Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {products.filter((p: any) => p.flash_sale).map((p: any) => {
                  const active = p.flash_sale_end && new Date(p.flash_sale_end) > new Date();
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-body text-xs font-medium">{p.name}</TableCell>
                      <TableCell className="font-body text-xs">${Number(p.price).toFixed(2)}</TableCell>
                      <TableCell className="font-body text-xs text-destructive font-bold">${Number(p.flash_sale_price || 0).toFixed(2)}</TableCell>
                      <TableCell className="font-body text-xs">{p.flash_sale_end ? new Date(p.flash_sale_end).toLocaleString() : "—"}</TableCell>
                      <TableCell><Badge variant={active ? "destructive" : "outline"} className="text-[10px]">{active ? "Live" : "Ended"}</Badge></TableCell>
                    </TableRow>
                  );
                })}
                {products.filter((p: any) => p.flash_sale).length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No flash sales configured</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default AdminShop;
