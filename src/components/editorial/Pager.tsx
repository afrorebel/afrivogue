import { ChevronLeft, ChevronRight } from "lucide-react";

interface PagerProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

/** Previous / page count / next control in rounded pills. */
const Pager = ({ page, totalPages, onChange }: PagerProps) => {
  if (totalPages <= 1) return null;
  const btn =
    "inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 font-body text-sm font-medium text-foreground transition-colors hover:border-gold hover:text-gold disabled:pointer-events-none disabled:opacity-30";
  return (
    <div className="mt-14 flex items-center justify-center gap-3">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)} className={btn}>
        <ChevronLeft className="h-4 w-4" /> Previous
      </button>
      <span className="min-w-[5rem] text-center font-body text-sm tabular-nums text-muted-foreground">
        {page} of {totalPages}
      </span>
      <button disabled={page >= totalPages} onClick={() => onChange(page + 1)} className={btn}>
        Next <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Pager;
