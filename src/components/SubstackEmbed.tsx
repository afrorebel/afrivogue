import { useEffect, useRef } from "react";

interface SubstackEmbedProps {
  substackUrl?: string;
  className?: string;
}

const SubstackEmbed = ({ substackUrl = "afrivogue.substack.com", className = "" }: SubstackEmbedProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Set the global config Substack's widget expects
    (window as any).CustomSubstackWidget = {
      substackUrl,
      placeholder: "your@email.com",
      buttonText: "Subscribe",
      theme: "custom",
      colors: {
        primary: "#B8922A",
        input: "#0a0a0a",
        email: "#f5f0e8",
        text: "#0a0a0a",
      },
    };

    // Load Substack widget script
    const existing = document.getElementById("substack-widget-script");
    if (existing) {
      existing.remove();
    }
    const script = document.createElement("script");
    script.id = "substack-widget-script";
    script.src = "https://substackapi.com/widget.js";
    script.async = true;
    containerRef.current.appendChild(script);

    return () => {
      script.remove();
    };
  }, [substackUrl]);

  return (
    <div ref={containerRef} className={className}>
      <div id="custom-substack-embed" />
    </div>
  );
};

export default SubstackEmbed;
