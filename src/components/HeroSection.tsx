import heroImage from "@/assets/hero-fashion.jpg";

const HeroSection = () => {
  return (
    <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="African haute couture editorial"
          className="h-full w-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-12 md:px-16 lg:px-24">
        <p className="mb-3 font-body text-xs font-semibold uppercase tracking-[0.3em] text-gold">
          Global Trend Intelligence
        </p>
        <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.1] text-foreground md:text-6xl lg:text-7xl">
          The Pulse of African &amp; Global Fashion
        </h1>
        <p className="mt-4 max-w-xl font-body text-base text-muted-foreground md:text-lg">
          Curated signals from the frontlines of fashion, beauty, culture, and the creative economy — centering African and Black voices.
        </p>
        <div className="mt-6 h-px w-24 gradient-gold" />
      </div>
    </section>
  );
};

export default HeroSection;
