import { Link } from "react-router-dom";
import { motion } from "framer-motion";

/** Editorial-style membership invitation band used across public pages. */
const MembershipCTA = () => (
  <section className="px-6 py-24 md:px-12 lg:px-16">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mx-auto max-w-7xl border-y border-gold/30 py-16"
    >
      <div className="grid grid-cols-1 items-end gap-8 md:grid-cols-12">
        <div className="md:col-span-7">
          <p className="mb-5 font-body text-[9px] uppercase tracking-[0.4em] text-gold">Membership</p>
          <h2 className="font-display text-4xl italic leading-[0.95] text-foreground md:text-6xl">
            Join the <span className="text-gold">Collective</span>
          </h2>
        </div>
        <div className="md:col-span-5">
          <p className="mb-8 font-body text-xs uppercase leading-relaxed tracking-[0.18em] text-muted-foreground">
            Unlock premium editorials, earn from your contributions, and stand with a global community of culture
            shapers.
          </p>
          <div className="flex flex-wrap items-center gap-8">
            <Link
              to="/membership"
              className="group inline-flex items-center gap-4 border-b border-gold pb-1 font-body text-[10px] uppercase tracking-[0.4em] text-gold"
            >
              Become a Member
              <span className="h-px w-8 bg-gold transition-all duration-500 group-hover:w-14" />
            </Link>
            <Link
              to="/about"
              className="border-b border-border pb-1 font-body text-[10px] uppercase tracking-[0.4em] text-foreground transition-colors hover:border-gold hover:text-gold"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  </section>
);

export default MembershipCTA;
