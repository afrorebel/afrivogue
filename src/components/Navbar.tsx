import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, User } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import SearchDialog from "@/components/SearchDialog";
import ThemeToggle from "@/components/ThemeToggle";
import CartDrawer from "@/components/shop/CartDrawer";
import Wordmark from "@/components/brand/Wordmark";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Stories", href: "/trends" },
  { label: "Editorials", href: "/editorials" },
  { label: "Moodboard", href: "/moodboard" },
  { label: "Shop", href: "/shop" },
  { label: "Forecast", href: "/forecast" },
  { label: "Voices", href: "/contributors" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu whenever the route changes.
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <nav
        className={`fixed top-0 z-50 w-full border-b px-4 transition-all duration-300 md:px-8 lg:px-12 ${
          scrolled ? "border-border/60 bg-background/85 shadow-soft backdrop-blur-xl" : "border-transparent bg-background/60 backdrop-blur-md"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-6">
          <Link to="/" aria-label="Afrivogue home" className="shrink-0">
            <Wordmark className="text-2xl md:text-[1.7rem]" />
          </Link>

          <div className="hidden items-center gap-0.5 xl:flex">
            {navLinks.map((l) => (
              <Link
                key={l.label}
                to={l.href}
                className={`rounded-full px-3.5 py-2 font-body text-[13px] font-medium transition-colors ${
                  isActive(l.href)
                    ? "bg-gold/15 text-gold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <SearchDialog />
            <CartDrawer />
            <ThemeToggle />
            {user ? (
              <Link
                to="/dashboard"
                className="ml-1 hidden items-center gap-1.5 rounded-full border border-gold/50 px-4 py-2 font-body text-xs font-semibold text-gold transition-colors hover:bg-gold/10 md:flex"
              >
                <User className="h-3.5 w-3.5" /> Dashboard
              </Link>
            ) : (
              <Link
                to="/auth"
                className="ml-1 hidden rounded-full bg-gold px-5 py-2 font-body text-xs font-semibold text-primary-foreground transition-transform hover:scale-[1.03] md:flex"
              >
                Join
              </Link>
            )}
            <button
              onClick={() => setOpen(!open)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted xl:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 overflow-y-auto bg-background/97 px-6 pb-10 pt-24 backdrop-blur-xl xl:hidden"
          >
            <div className="mx-auto flex max-w-md flex-col gap-2">
              {navLinks.map((l, i) => (
                <motion.div
                  key={l.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    to={l.href}
                    className={`block rounded-2xl px-5 py-3 font-display text-2xl italic transition-colors ${
                      isActive(l.href) ? "bg-gold/15 text-gold" : "text-foreground hover:bg-muted"
                    }`}
                  >
                    {l.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navLinks.length * 0.04 }}
                className="mt-4"
              >
                <Link
                  to={user ? "/dashboard" : "/auth"}
                  className="block rounded-full bg-gold px-6 py-3.5 text-center font-body text-sm font-semibold text-primary-foreground"
                >
                  {user ? "Go to Dashboard" : "Join Afrivogue"}
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
