import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Image as ImageIcon, Link as LinkIcon,
  AlignLeft, AlignCenter, AlignRight, Code, Minus, Instagram, Youtube
} from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const RichTextEditor = ({ content, onChange, placeholder = "Write your article…" }: RichTextEditorProps) => {
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [embedCode, setEmbedCode] = useState("");
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [embedDialogOpen, setEmbedDialogOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none min-h-[300px] p-4 focus:outline-none font-body",
      },
    },
  });

  if (!editor) return null;

  const addImage = () => {
    if (imageUrl.trim()) {
      editor.chain().focus().setImage({ src: imageUrl.trim() }).run();
      setImageUrl("");
      setImageDialogOpen(false);
    }
  };

  const addLink = () => {
    if (linkUrl.trim()) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl.trim() }).run();
      setLinkUrl("");
      setLinkDialogOpen(false);
    }
  };

  const addEmbed = () => {
    if (embedCode.trim()) {
      // Insert as raw HTML block
      editor.chain().focus().insertContent(`<div data-embed="true">${embedCode.trim()}</div>`).run();
      setEmbedCode("");
      setEmbedDialogOpen(false);
    }
  };

  const ToolBtn = ({ active, onClick, children, title }: { active?: boolean; onClick: () => void; children: React.ReactNode; title: string }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex h-8 w-8 items-center justify-center rounded transition-colors ${
        active ? "bg-gold/20 text-gold" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 p-1.5">
        <ToolBtn active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1">
          <Heading1 className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2">
          <Heading2 className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3">
          <Heading3 className="h-4 w-4" />
        </ToolBtn>

        <div className="mx-1 h-5 w-px bg-border" />

        <ToolBtn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
          <Bold className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
          <Italic className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
          <UnderlineIcon className="h-4 w-4" />
        </ToolBtn>

        <div className="mx-1 h-5 w-px bg-border" />

        <ToolBtn active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Align Left">
          <AlignLeft className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Align Center">
          <AlignCenter className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Align Right">
          <AlignRight className="h-4 w-4" />
        </ToolBtn>

        <div className="mx-1 h-5 w-px bg-border" />

        <ToolBtn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List">
          <List className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered List">
          <ListOrdered className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Blockquote">
          <Quote className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code Block">
          <Code className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
          <Minus className="h-4 w-4" />
        </ToolBtn>

        <div className="mx-1 h-5 w-px bg-border" />

        {/* Image dialog */}
        <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
          <DialogTrigger asChild>
            <button type="button" title="Insert Image" className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <ImageIcon className="h-4 w-4" />
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle className="font-display">Insert Image</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addImage())} />
              <Button onClick={addImage} className="w-full bg-gold text-primary-foreground hover:bg-gold/90">Insert</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Link dialog */}
        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <DialogTrigger asChild>
            <button type="button" title="Insert Link" className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <LinkIcon className="h-4 w-4" />
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle className="font-display">Insert Link</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="https://..." value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLink())} />
              <Button onClick={addLink} className="w-full bg-gold text-primary-foreground hover:bg-gold/90">Apply Link</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Embed dialog (social, HTML, etc) */}
        <Dialog open={embedDialogOpen} onOpenChange={setEmbedDialogOpen}>
          <DialogTrigger asChild>
            <button type="button" title="Embed (Social, HTML, etc)" className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Instagram className="h-4 w-4" />
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle className="font-display">Embed Content</DialogTitle></DialogHeader>
            <p className="font-body text-xs text-muted-foreground">Paste embed code from Instagram, X/Twitter, Pinterest, YouTube, or any HTML snippet.</p>
            <textarea
              className="w-full rounded-lg border border-border bg-background p-3 font-body text-sm min-h-[120px]"
              placeholder='<blockquote class="instagram-media"...'
              value={embedCode}
              onChange={(e) => setEmbedCode(e.target.value)}
            />
            <Button onClick={addEmbed} className="w-full bg-gold text-primary-foreground hover:bg-gold/90">Insert Embed</Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
