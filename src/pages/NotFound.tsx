import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageMasthead from "@/components/editorial/PageMasthead";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PageMasthead
        eyebrow="Error 404"
        title="Lost in"
        accent="Translation"
        intro="The page you were looking for has moved, been retired, or never existed. The story continues elsewhere."
        meta="Page Not Found"
      />
      <main className="px-6 pb-32 md:px-12 lg:px-16">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-10 border-t border-border/60 pt-10">
          <Link
            to="/"
            className="group inline-flex items-center gap-4 border-b border-gold pb-1 font-body text-[10px] uppercase tracking-[0.4em] text-gold"
          >
            Return Home
            <span className="h-px w-8 bg-gold transition-all duration-500 group-hover:w-14" />
          </Link>
          <Link
            to="/trends"
            className="border-b border-border pb-1 font-body text-[10px] uppercase tracking-[0.4em] text-foreground transition-colors hover:border-gold hover:text-gold"
          >
            Latest Stories
          </Link>
          <Link
            to="/editorials"
            className="border-b border-border pb-1 font-body text-[10px] uppercase tracking-[0.4em] text-foreground transition-colors hover:border-gold hover:text-gold"
          >
            Editorials
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
