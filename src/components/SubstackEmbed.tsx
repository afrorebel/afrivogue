import { useEffect, useRef } from "react";

interface SupascribeEmbedProps {
  className?: string;
}

const SupascribeEmbed = ({ className = "" }: SupascribeEmbedProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Avoid loading the script multiple times
    const scriptId = "supascribe-loader-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://js.supascribe.com/v1/loader/9B6VXF1MuGVONUTiF002uFmxE2T2.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div ref={containerRef} className={className}>
      <div data-supascribe-embed-id="811387249347" data-supascribe-subscribe />
    </div>
  );
};

export default SupascribeEmbed;
