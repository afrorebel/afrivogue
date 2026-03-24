import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

interface SearchResult {
  id: string;
  headline?: string;
  title?: string;
  type: "trend" | "forecast";
}

const SearchDialog = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const navigate = useNavigate();

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }

    const [trendsRes, forecastsRes] = await Promise.all([
      supabase
        .from("trends")
        .select("id, headline")
        .eq("published", true)
        .ilike("headline", `%${q}%`)
        .limit(5),
      supabase
        .from("forecasts")
        .select("id, title")
        .eq("published", true)
        .ilike("title", `%${q}%`)
        .limit(3),
    ]);

    const trendResults: SearchResult[] = (trendsRes.data ?? []).map((t) => ({
      id: t.id,
      headline: t.headline,
      type: "trend" as const,
    }));

    const forecastResults: SearchResult[] = (forecastsRes.data ?? []).map((f) => ({
      id: f.id,
      title: f.title,
      type: "forecast" as const,
    }));

    setResults([...trendResults, ...forecastResults]);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 250);
    return () => clearTimeout(timer);
  }, [query, search]);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery("");
    if (result.type === "trend") {
      navigate(`/trend/${result.id}`);
    } else {
      navigate(`/forecast`);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-sm border border-border px-3 py-1.5 font-body text-xs text-muted-foreground transition-colors hover:border-gold/40 hover:text-foreground"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden md:inline">Search</span>
        <kbd className="ml-1 hidden rounded border border-border bg-muted px-1.5 py-0.5 font-body text-[10px] text-muted-foreground md:inline">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search trends, forecasts…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {results.filter((r) => r.type === "trend").length > 0 && (
            <CommandGroup heading="Trends">
              {results
                .filter((r) => r.type === "trend")
                .map((r) => (
                  <CommandItem key={r.id} onSelect={() => handleSelect(r)}>
                    <span className="mr-2 text-[10px] text-gold">◆</span>
                    {r.headline}
                  </CommandItem>
                ))}
            </CommandGroup>
          )}
          {results.filter((r) => r.type === "forecast").length > 0 && (
            <CommandGroup heading="Forecasts">
              {results
                .filter((r) => r.type === "forecast")
                .map((r) => (
                  <CommandItem key={r.id} onSelect={() => handleSelect(r)}>
                    <span className="mr-2 text-[10px] text-terracotta">●</span>
                    {r.title}
                  </CommandItem>
                ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default SearchDialog;
