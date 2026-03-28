import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Link as LinkIcon, X, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ImageUploadProps {
  bucket: string;
  folder?: string;
  value: string[];
  onChange: (urls: string[]) => void;
  multiple?: boolean;
  label?: string;
}

const ImageUpload = ({ bucket, folder = "", value, onChange, multiple = true, label = "Images" }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const path = `${folder ? folder + "/" : ""}${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from(bucket).upload(path, file);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
        newUrls.push(urlData.publicUrl);
      }
      onChange(multiple ? [...value, ...newUrls] : newUrls.slice(0, 1));
      toast({ title: `${newUrls.length} image(s) uploaded` });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const addUrl = () => {
    if (!urlInput.trim()) return;
    const urls = urlInput.split("\n").map(u => u.trim()).filter(Boolean);
    onChange(multiple ? [...value, ...urls] : urls.slice(0, 1));
    setUrlInput("");
  };

  const removeImage = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="upload" className="flex-1"><Upload className="mr-1 h-3 w-3" /> Upload</TabsTrigger>
          <TabsTrigger value="url" className="flex-1"><LinkIcon className="mr-1 h-3 w-3" /> URL</TabsTrigger>
        </TabsList>
        <TabsContent value="upload" className="mt-2">
          <div
            className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-gold"
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="font-body text-sm">Uploading…</span>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-1 font-body text-sm text-muted-foreground">Click to upload images</p>
                <p className="font-body text-[10px] text-muted-foreground">JPG, PNG, WebP up to 5MB</p>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple={multiple}
            className="hidden"
            onChange={handleFileUpload}
          />
        </TabsContent>
        <TabsContent value="url" className="mt-2 space-y-2">
          <Input
            placeholder="https://example.com/image.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
          />
          <Button type="button" size="sm" variant="outline" onClick={addUrl}>Add URL</Button>
        </TabsContent>
      </Tabs>

      {/* Preview */}
      {value.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {value.map((url, i) => (
            <div key={i} className="relative h-16 w-16 overflow-hidden rounded border border-border">
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
