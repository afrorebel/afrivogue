import { Share2, Link as LinkIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ShareButtonsProps {
  title: string;
  url?: string;
}

const ShareButtons = ({ title, url }: ShareButtonsProps) => {
  const shareUrl = url || window.location.href;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    toast({ title: "Link copied", description: "Share it anywhere." });
  };

  return (
    <div className="flex items-center gap-3">
      <span className="font-body text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
        Share
      </span>
      <a
        href={`https://x.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-8 w-8 items-center justify-center rounded-sm border border-border font-body text-[10px] font-bold text-muted-foreground transition-all hover:border-gold hover:text-gold"
        title="Share on X"
      >
        X
      </a>
      <a
        href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-8 w-8 items-center justify-center rounded-sm border border-border font-body text-[10px] font-bold text-muted-foreground transition-all hover:border-gold hover:text-gold"
        title="Share on WhatsApp"
      >
        WA
      </a>
      <button
        onClick={copyLink}
        className="flex h-8 w-8 items-center justify-center rounded-sm border border-border text-muted-foreground transition-all hover:border-gold hover:text-gold"
        title="Copy link"
      >
        <LinkIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default ShareButtons;
