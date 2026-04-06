import { useState, useRef } from "react";
import { uploadImage } from "@/lib/uploadImage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ImageUrlUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
  bucket?: string;
  folder?: string;
}

const ImageUrlUpload = ({
  value,
  onChange,
  label = "Image URL",
  placeholder = "https://example.com/image.png",
  bucket = "email-assets",
  folder = "",
}: ImageUrlUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const publicUrl = await uploadImage(file);
      onChange(publicUrl);
      toast({ title: "Image uploaded" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex h-10 items-center gap-1.5 rounded-md border border-border bg-muted px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "…" : "Upload"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
      </div>
      {value && (
        <div className="mt-1 flex items-center gap-2">
          <img src={value} alt="" className="h-8 w-8 rounded border border-border object-contain" />
          <span className="truncate text-xs text-muted-foreground">{value.split("/").pop()}</span>
        </div>
      )}
    </div>
  );
};

export default ImageUrlUpload;
