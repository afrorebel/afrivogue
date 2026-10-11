import { useState } from "react";
import { Sun, Moon } from "lucide-react";

/**
 * Light is the default theme. index.html applies the stored choice before first paint,
 * so this toggle only reads the current state and flips it.
 */
const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(
    () => typeof document !== "undefined" && !document.documentElement.classList.contains("light"),
  );

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("light", !next);
    try {
      localStorage.setItem("afrivogue_theme", next ? "dark" : "light");
    } catch {
      // storage can be unavailable (private mode); the theme still switches for this visit
    }
  };

  return (
    <button
      onClick={toggle}
      className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
};

export default ThemeToggle;
