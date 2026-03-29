import { Share2, Link as LinkIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface StickyShareButtonsProps {
  title: string;
  url?: string;
}

const StickyShareButtons = ({ title, url }: StickyShareButtonsProps) => {
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    toast({ title: "Link copied", description: "Share it anywhere." });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1, duration: 0.4 }}
      className="fixed left-4 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-3"
    >
      <span className="font-body text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground text-center mb-1">
        Share
      </span>
      <a
        href={`https://x.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card font-body text-xs font-bold text-muted-foreground transition-all hover:border-gold hover:text-gold hover:shadow-lg"
        title="Share on X"
      >
        X
      </a>
      <a
        href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card font-body text-xs font-bold text-muted-foreground transition-all hover:border-gold hover:text-gold hover:shadow-lg"
        title="Share on WhatsApp"
      >
        WA
      </a>
      <a
        href={`https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card font-body text-xs font-bold text-muted-foreground transition-all hover:border-gold hover:text-gold hover:shadow-lg"
        title="Share on Pinterest"
      >
        P
      </a>
      <button
        onClick={copyLink}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-all hover:border-gold hover:text-gold hover:shadow-lg"
        title="Copy link"
      >
        <LinkIcon className="h-4 w-4" />
      </button>
    </motion.div>
  );
};

export default StickyShareButtons;
