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
      <main className="px-4 pb-32 md:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1440px] flex-wrap gap-3">
          <Link
            to="/"
            className="group inline-flex items-center gap-3 rounded-full bg-gold px-6 py-3 font-body text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            Return Home
            <span className="h-px w-6 bg-primary-foreground/70 transition-all duration-500 group-hover:w-10" />
          </Link>
          <Link
            to="/trends"
            className="rounded-full border border-border bg-card px-6 py-3 font-body text-sm font-medium text-foreground transition-colors hover:border-gold hover:text-gold"
          >
            Latest Stories
          </Link>
          <Link
            to="/editorials"
            className="rounded-full border border-border bg-card px-6 py-3 font-body text-sm font-medium text-foreground transition-colors hover:border-gold hover:text-gold"
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
