const Navbar = () => {
  return (
    <nav className="fixed top-0 z-50 flex w-full items-center justify-between border-b border-border/50 bg-background/80 px-6 py-4 backdrop-blur-md md:px-16 lg:px-24">
      <div className="font-display text-2xl font-bold tracking-tight text-foreground">
        AFRI<span className="text-gold">VOGUE</span>
      </div>
      <div className="hidden items-center gap-8 font-body text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground md:flex">
        <a href="#" className="transition-colors hover:text-gold">Trends</a>
        <a href="#" className="transition-colors hover:text-gold">Culture</a>
        <a href="#" className="transition-colors hover:text-gold">Industry</a>
        <a href="#" className="transition-colors hover:text-gold">About</a>
      </div>
      <div className="h-2 w-2 rounded-full bg-gold animate-pulse" title="Live intelligence" />
    </nav>
  );
};

export default Navbar;
