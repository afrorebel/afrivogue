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
  const [searching, setSearching] = useState(false);
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

    setSearching(true);

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
    setSearching(false);
  }, []);

  // Real-time search as user types
  useEffect(() => {
    const timer = setTimeout(() => search(query), 150);
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
        className="flex items-center justify-center rounded-sm p-1.5 text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search trends, forecasts…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {searching && query.length >= 2 && (
            <p className="px-4 py-3 text-center font-body text-xs text-muted-foreground">Searching…</p>
          )}
          {!searching && query.length >= 2 && results.length === 0 && (
            <CommandEmpty>No results found.</CommandEmpty>
          )}
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
