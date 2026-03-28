import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Package, Sparkles } from "lucide-react";

const AdminBundlesCrossSell = () => {
  const qc = useQueryClient();
  const [bundleOpen, setBundleOpen] = useState(false);
  const [crossSellOpen, setCrossSellOpen] = useState(false);
  const [bundleName, setBundleName] = useState("");
  const [bundleDesc, setBundleDesc] = useState("");
  const [bundleDiscount, setBundleDiscount] = useState("10");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [sourceProduct, setSourceProduct] = useState("");
  const [recProduct, setRecProduct] = useState("");

  const { data: products = [] } = useQuery({
    queryKey: ["admin-all-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name, price, images").order("name");
      return (data || []).map((p: any) => ({ ...p, images: (p.images as string[]) || [] }));
    },
  });

  const { data: bundles = [] } = useQuery({
    queryKey: ["admin-bundles"],
    queryFn: async () => {
      const { data: allBundles } = await supabase.from("product_bundles").select("*").order("created_at", { ascending: false });
      if (!allBundles?.length) return [];
      const ids = allBundles.map((b: any) => b.id);
      const { data: items } = await supabase.from("bundle_items").select("*, product:products(name)").in("bundle_id", ids);
      const map: Record<string, any[]> = {};
      (items || []).forEach((i: any) => {
        if (!map[i.bundle_id]) map[i.bundle_id] = [];
        map[i.bundle_id].push(i);
      });
      return allBundles.map((b: any) => ({ ...b, items: map[b.id] || [] }));
    },
  });

  const { data: crossSellRules = [] } = useQuery({
    queryKey: ["admin-cross-sell"],
    queryFn: async () => {
      const { data } = await supabase
        .from("cross_sell_rules")
        .select("*, source:products!cross_sell_rules_source_product_id_fkey(name), recommended:products!cross_sell_rules_recommended_product_id_fkey(name)")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const saveBundle = async () => {
    if (!bundleName || selectedProducts.length < 2) {
      toast({ title: "Need a name and at least 2 products", variant: "destructive" });
      return;
    }
    const { data: bundle, error } = await supabase
      .from("product_bundles")
      .insert({ name: bundleName, description: bundleDesc, discount_percentage: parseFloat(bundleDiscount) || 10, published: true })
      .select()
      .single();
    if (error) { toast({ title: error.message, variant: "destructive" }); return; }
    const items = selectedProducts.map((pid) => ({ bundle_id: bundle.id, product_id: pid }));
    await supabase.from("bundle_items").insert(items);
    qc.invalidateQueries({ queryKey: ["admin-bundles"] });
    setBundleOpen(false);
    setBundleName(""); setBundleDesc(""); setBundleDiscount("10"); setSelectedProducts([]);
    toast({ title: "Bundle created!" });
  };

  const deleteBundle = async (id: string) => {
    await supabase.from("product_bundles").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-bundles"] });
    toast({ title: "Bundle deleted" });
  };

  const toggleBundlePublished = async (id: string, published: boolean) => {
    await supabase.from("product_bundles").update({ published: !published }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-bundles"] });
  };

  const saveCrossSell = async () => {
    if (!sourceProduct || !recProduct || sourceProduct === recProduct) {
      toast({ title: "Select two different products", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("cross_sell_rules").insert({
      source_product_id: sourceProduct,
      recommended_product_id: recProduct,
    });
    if (error) { toast({ title: error.message, variant: "destructive" }); return; }
    qc.invalidateQueries({ queryKey: ["admin-cross-sell"] });
    setCrossSellOpen(false);
    setSourceProduct(""); setRecProduct("");
    toast({ title: "Cross-sell rule added!" });
  };

  const deleteCrossSell = async (id: string) => {
    await supabase.from("cross_sell_rules").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-cross-sell"] });
    toast({ title: "Rule deleted" });
  };

  const toggleProduct = (pid: string) => {
    setSelectedProducts((prev) => prev.includes(pid) ? prev.filter((p) => p !== pid) : [...prev, pid]);
  };

  return (
    <Tabs defaultValue="bundles">
      <TabsList className="mb-4">
        <TabsTrigger value="bundles"><Package className="mr-1 h-4 w-4" /> Bundles ({bundles.length})</TabsTrigger>
        <TabsTrigger value="crosssell"><Sparkles className="mr-1 h-4 w-4" /> Cross-Sell ({crossSellRules.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="bundles">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display text-lg">Product Bundles</CardTitle>
            <Dialog open={bundleOpen} onOpenChange={setBundleOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="mr-1 h-4 w-4" /> New Bundle</Button>
              </DialogTrigger>
              <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Create Bundle</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Name</Label><Input value={bundleName} onChange={(e) => setBundleName(e.target.value)} placeholder="Festival Ready Kit" /></div>
                  <div><Label>Description</Label><Input value={bundleDesc} onChange={(e) => setBundleDesc(e.target.value)} placeholder="Everything for festival season" /></div>
                  <div><Label>Discount %</Label><Input type="number" value={bundleDiscount} onChange={(e) => setBundleDiscount(e.target.value)} /></div>
                  <div>
                    <Label>Select Products (min 2)</Label>
                    <div className="mt-2 max-h-48 overflow-y-auto space-y-1 rounded border border-border p-2">
                      {products.map((p: any) => (
                        <label key={p.id} className="flex items-center gap-2 cursor-pointer py-1 px-2 rounded hover:bg-muted">
                          <input type="checkbox" checked={selectedProducts.includes(p.id)} onChange={() => toggleProduct(p.id)} className="accent-gold" />
                          <span className="font-body text-xs">{p.name} — ${p.price}</span>
                        </label>
                      ))}
                    </div>
                    <p className="font-body text-xs text-muted-foreground mt-1">{selectedProducts.length} selected</p>
                  </div>
                  <Button onClick={saveBundle} className="w-full">Create Bundle</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {bundles.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 font-body text-sm">No bundles yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bundles.map((b: any) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-body text-xs font-medium">{b.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {b.items.map((i: any) => (
                            <Badge key={i.id} variant="outline" className="text-[10px]">{i.product?.name || "?"}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="font-body text-xs text-gold font-bold">{b.discount_percentage}%</TableCell>
                      <TableCell>
                        <Switch checked={b.published} onCheckedChange={() => toggleBundlePublished(b.id, b.published)} />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteBundle(b.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="crosssell">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display text-lg">Cross-Sell Rules</CardTitle>
            <Dialog open={crossSellOpen} onOpenChange={setCrossSellOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="mr-1 h-4 w-4" /> New Rule</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Cross-Sell Rule</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>When viewing</Label>
                    <Select value={sourceProduct} onValueChange={setSourceProduct}>
                      <SelectTrigger><SelectValue placeholder="Source product" /></SelectTrigger>
                      <SelectContent>{products.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Recommend</Label>
                    <Select value={recProduct} onValueChange={setRecProduct}>
                      <SelectTrigger><SelectValue placeholder="Recommended product" /></SelectTrigger>
                      <SelectContent>{products.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Button onClick={saveCrossSell} className="w-full">Add Rule</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {crossSellRules.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 font-body text-sm">No cross-sell rules yet. Products will fall back to same-category recommendations.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source Product</TableHead>
                    <TableHead>→</TableHead>
                    <TableHead>Recommended</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {crossSellRules.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-body text-xs">{r.source?.name || r.source_product_id}</TableCell>
                      <TableCell className="text-gold">→</TableCell>
                      <TableCell className="font-body text-xs">{r.recommended?.name || r.recommended_product_id}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteCrossSell(r.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default AdminBundlesCrossSell;
