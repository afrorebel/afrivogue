import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Mail, ExternalLink, Download, FileText, Image } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MediaKitData {
  about: string;
  audience_description: string;
  primary_markets: string;
  stats: { label: string; value: string }[];
  packages: { name: string; deliverables: string; investment: string }[];
  coverage_areas: string;
  inspiration_brands: string;
  cta_headline: string;
  cta_email: string;
}

const DEFAULT_DATA: MediaKitData = {
  about:
    "AfriVogue is a global fashion and lifestyle media platform celebrating African creativity, luxury, and Black excellence on a world stage. We publish editorial content across fashion, beauty, culture, business, and the luxury lifestyle — told through a distinctly Afrocentric lens, for a global audience that expects excellence. AfriVogue is where culture, creativity, and confidence collide.",
  audience_description:
    "Fashion-forward, culturally engaged, brand-conscious millennials and Gen Z consumers across Africa and the global diaspora.",
  primary_markets: "Nigeria · UK · USA · Ghana · South Africa · France",
  stats: [
    { label: "Instagram followers", value: "5K+" },
    { label: "Email subscribers", value: "200+" },
    { label: "Monthly impressions", value: "10K+" },
    { label: "Audience 18–34", value: "80%" },
  ],
  packages: [
    {
      name: "Gifted Feature",
      deliverables: "1 editorial carousel post + story coverage + brand mention in caption",
      investment: "Product gift",
    },
    {
      name: "The Spotlight",
      deliverables: "1 dedicated carousel + 1 Reel feature + story series (5 slides) + caption tag",
      investment: "₦20,000 – ₦40,000",
    },
    {
      name: "The Campaign",
      deliverables:
        "2 carousels + 2 Reels + story series + newsletter feature + written brand profile",
      investment: "₦50,000 – ₦100,000",
    },
    {
      name: "Bespoke",
      deliverables:
        "Custom campaign — digital issue sponsorship, event coverage, ambassador partnership",
      investment: "Let's talk",
    },
  ],
  coverage_areas: "Fashion · Beauty · Luxury Lifestyle · Culture & Art · Business of Fashion · Celebrity & Influence",
  inspiration_brands: "Vogue · Harper's Bazaar · Essence · Nataal · OkayAfrica · i-D · Business of Fashion",
  cta_headline: "Let's Build Something Iconic",
  cta_email: "contact@afrivogue.com",
};

const anim = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay },
});

const MediaKit = () => {
  const { data: kit } = useQuery({
    queryKey: ["media-kit"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "media_kit")
        .maybeSingle();
      return data?.value ? { ...DEFAULT_DATA, ...(data.value as unknown as Partial<MediaKitData>) } : DEFAULT_DATA;
    },
  });

  const d = kit ?? DEFAULT_DATA;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="relative flex items-center justify-center px-6 pb-16 pt-32 md:px-16 lg:px-24">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <motion.div {...anim()} className="relative z-10 text-center">
          <p className="font-body text-xs uppercase tracking-[0.3em] text-primary">Partner With Us</p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            Media <span className="text-primary">Kit</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md font-body text-sm leading-relaxed text-muted-foreground md:text-base">
            Global Fashion · Culture · Black Excellence
          </p>
        </motion.div>
      </section>

      <section className="mx-auto max-w-5xl space-y-16 px-6 pb-24 md:px-16 lg:px-24">
        {/* About + Audience */}
        <div className="grid gap-8 lg:grid-cols-5">
          <motion.div {...anim(0.1)} className="lg:col-span-3 space-y-3">
            <h2 className="font-display text-xl font-semibold">About Afrivogue</h2>
            <p className="font-body text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{d.about}</p>
          </motion.div>
          <motion.div {...anim(0.2)} className="lg:col-span-2 space-y-3">
            <h2 className="font-display text-xl font-semibold">Our Audience</h2>
            <p className="font-body text-sm leading-relaxed text-muted-foreground">{d.audience_description}</p>
            <p className="font-body text-xs font-medium text-primary">{d.primary_markets}</p>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div {...anim(0.15)} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {d.stats.map((s, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-5 text-center">
              <p className="font-display text-3xl font-bold text-primary">{s.value}</p>
              <p className="mt-1 font-body text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Packages */}
        <motion.div {...anim(0.2)}>
          <h2 className="mb-6 font-display text-2xl font-bold tracking-tight">Partnership Packages</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-3 pr-4 text-left font-display text-xs uppercase tracking-wider text-muted-foreground">Package</th>
                  <th className="py-3 px-4 text-left font-display text-xs uppercase tracking-wider text-muted-foreground">Deliverables</th>
                  <th className="py-3 pl-4 text-right font-display text-xs uppercase tracking-wider text-muted-foreground">Investment</th>
                </tr>
              </thead>
              <tbody>
                {d.packages.map((p, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="py-4 pr-4 font-display text-sm font-semibold text-foreground align-top whitespace-nowrap">{p.name}</td>
                    <td className="py-4 px-4 font-body text-sm text-muted-foreground">{p.deliverables}</td>
                    <td className="py-4 pl-4 text-right font-display text-sm font-semibold text-primary whitespace-nowrap">{p.investment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Coverage + Inspiration */}
        <div className="grid gap-8 md:grid-cols-2">
          <motion.div {...anim(0.25)} className="space-y-2">
            <h3 className="font-display text-lg font-semibold">What We Cover</h3>
            <p className="font-body text-sm text-muted-foreground">{d.coverage_areas}</p>
          </motion.div>
          <motion.div {...anim(0.3)} className="space-y-2">
            <h3 className="font-display text-lg font-semibold">Inspiration Brands</h3>
            <p className="font-body text-sm italic text-muted-foreground">{d.inspiration_brands}</p>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          {...anim(0.35)}
          className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-10 text-center"
        >
          <h2 className="font-display text-2xl font-bold md:text-3xl">{d.cta_headline}</h2>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="gap-2">
              <a href={`mailto:${d.cta_email}`}>
                <Mail className="h-4 w-4" /> {d.cta_email}
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <a href="/contact">
                <ExternalLink className="h-4 w-4" /> Contact Us
              </a>
            </Button>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default MediaKit;
