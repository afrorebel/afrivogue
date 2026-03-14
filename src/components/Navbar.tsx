import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const navLinks = [
  { label: "Trends", href: "/" },
  { label: "Editorials", href: "/editorials" },
  { label: "Forecast", href: "/forecast" },
  { label: "Story Mode", href: "/story/4" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
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
          {navLinks.map((l) => (
            <Link key={l.label} to={l.href} className="transition-colors hover:text-gold">
              {l.label}
            </Link>
          ))}
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
            <div className="flex h-full flex-col items-center justify-center gap-10">
              {navLinks.map((l, i) => (
                <motion.div
                  key={l.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: i * 0.08 }}
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
                transition={{ delay: 0.4 }}
                className="mt-6 h-px w-16 bg-gold/30"
              />
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
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
