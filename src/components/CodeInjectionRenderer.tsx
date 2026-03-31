import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CodeInjectionSettings {
  head_code: string;
  body_start_code: string;
  body_end_code: string;
}

const CodeInjectionRenderer = () => {
  const { data: settings } = useQuery({
    queryKey: ["site-code-injection"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "code_injection")
        .maybeSingle();
      if (error) throw error;
      return (data?.value as unknown as CodeInjectionSettings) || null;
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!settings) return;

    // Inject head code
    if (settings.head_code) {
      const existing = document.getElementById("lovable-head-injection");
      if (existing) existing.remove();
      const container = document.createElement("div");
      container.id = "lovable-head-injection";
      container.innerHTML = settings.head_code;
      // Move child nodes into <head>
      Array.from(container.childNodes).forEach((node) => {
        const clone = node.cloneNode(true);
        document.head.appendChild(clone);
      });
    }

    // Inject body start code
    if (settings.body_start_code) {
      const existing = document.getElementById("lovable-body-start-injection");
      if (existing) existing.remove();
      const wrapper = document.createElement("div");
      wrapper.id = "lovable-body-start-injection";
      wrapper.innerHTML = settings.body_start_code;
      const root = document.getElementById("root");
      if (root) {
        document.body.insertBefore(wrapper, root);
      }
    }

    // Inject body end code
    if (settings.body_end_code) {
      const existing = document.getElementById("lovable-body-end-injection");
      if (existing) existing.remove();
      const wrapper = document.createElement("div");
      wrapper.id = "lovable-body-end-injection";
      wrapper.innerHTML = settings.body_end_code;
      document.body.appendChild(wrapper);
    }

    return () => {
      document.getElementById("lovable-head-injection")?.remove();
      document.getElementById("lovable-body-start-injection")?.remove();
      document.getElementById("lovable-body-end-injection")?.remove();
    };
  }, [settings]);

  return null;
};

export default CodeInjectionRenderer;
