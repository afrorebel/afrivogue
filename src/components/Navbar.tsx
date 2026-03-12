import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const mainNav = [
  { label: "Trends", href: "/" },
  { label: "Forecast", href: "/forecast" },
];

const categoryNav = [
  { label: "Fashion", href: "/?cat=Fashion" },
  { label: "Lifestyle", href: "/?cat=Lifestyle" },
  { label: "Culture", href: "/?cat=Culture" },
  { label: "Entertainment", href: "/?cat=Entertainment" },
  { label: "Business", href: "/?cat=Business" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 z-50 flex w-full items-center justify-between border-b border-border/50 bg-background/80 px-6 py-4 backdrop-blur-md md:px-16 lg:px-24">
        <Link to="/" className="font-display text-2xl font-bold tracking-tight text-foreground">
          AFRI<span className="text-gold">VOGUE</span>
        </Link>

        <div className="hidden items-center gap-8 font-body text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground md:flex">
          {mainNav.map((l) => (
            <Link key={l.label} to={l.href} className="transition-colors hover:text-gold">
              {l.label}
            </Link>
          ))}

          {/* Categories dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 transition-colors hover:text-gold outline-none">
              Categories <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="min-w-[160px]">
              {categoryNav.map((c) => (
                <DropdownMenuItem key={c.label} asChild>
                  <Link to={c.href} className="font-body text-xs uppercase tracking-wider">
                    {c.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link to="/#about" className="transition-colors hover:text-gold">
            About
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="h-2 w-2 rounded-full bg-gold animate-pulse" title="Live feed" />
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center justify-center text-foreground md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-lg md:hidden"
          >
            <div className="flex h-full flex-col items-center justify-center gap-8">
              {mainNav.map((l, i) => (
                <motion.div
                  key={l.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link
                    to={l.href}
                    onClick={() => setOpen(false)}
                    className="font-display text-2xl font-bold uppercase tracking-[0.15em] text-foreground transition-colors hover:text-gold"
                  >
                    {l.label}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="h-px w-16 bg-gold/30"
              />

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="font-body text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
              >
                Categories
              </motion.p>

              {categoryNav.map((c, i) => (
                <motion.div
                  key={c.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: 0.25 + i * 0.06 }}
                >
                  <Link
                    to={c.href}
                    onClick={() => setOpen(false)}
                    className="font-display text-lg font-bold uppercase tracking-[0.15em] text-foreground/80 transition-colors hover:text-gold"
                  >
                    {c.label}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-4 h-px w-16 bg-gold/30"
              />
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65 }}
                className="font-body text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
              >
                Afrivogue Feed
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
