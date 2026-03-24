import heroImage from "@/assets/hero-fashion.jpg";

const HeroSection = () => {
  return (
    <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="African haute couture editorial"
          className="h-full w-full object-cover object-top" />
        
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-12 md:px-16 lg:px-24">
        <p className="mb-3 font-body text-xs font-semibold uppercase tracking-[0.3em] text-gold">
          Afrivogue Feed
        </p>
        <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.1] text-foreground md:text-6xl lg:text-7xl">
          Curating Culture, Style & Tomorrow
        </h1>
        <p className="mt-4 max-w-xl font-body text-base text-muted-foreground md:text-lg">
          Curating culture, style, and tomorrow. Afrivogue is a global destination for fashion, beauty, and cultural intelligence rooted in African excellence.
        </p>
        <div className="mt-6 h-px w-24 gradient-gold" />
      </div>
    </section>);

};

export default HeroSection;