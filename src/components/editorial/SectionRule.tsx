interface SectionRuleProps {
  label: string;
  className?: string;
}

/** Centered small-caps label sitting on a hairline rule. */
const SectionRule = ({ label, className = "" }: SectionRuleProps) => (
  <div className={`relative mb-16 flex items-center justify-center ${className}`}>
    <div className="absolute h-px w-full bg-border" />
    <span className="relative bg-background px-10 font-body text-[10px] font-bold uppercase tracking-[0.5em] text-gold">
      {label}
    </span>
  </div>
);

export default SectionRule;
