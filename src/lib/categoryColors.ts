/** Maps a category name to its colour token (see --cat-* in index.css). */
const CATEGORY_TOKENS: Record<string, string> = {
  Fashion: "--cat-fashion",
  Beauty: "--cat-beauty",
  Luxury: "--cat-luxury",
  Culture: "--cat-culture",
  "Art & Design": "--cat-art",
  Business: "--cat-business",
  Entertainment: "--cat-entertainment",
  Lifestyle: "--cat-lifestyle",
  Accessories: "--cat-accessories",
};

export const categoryToken = (category?: string | null) =>
  (category && CATEGORY_TOKENS[category]) || "--gold";

/** CSS colour string for a category, optionally with alpha (0–1). */
export const categoryColor = (category?: string | null, alpha?: number) =>
  alpha === undefined
    ? `hsl(var(${categoryToken(category)}))`
    : `hsl(var(${categoryToken(category)}) / ${alpha})`;
