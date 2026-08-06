/**
 * Section eyebrow — a short red rule followed by a mono, wide-tracked label.
 * The one structural device repeated down the homepage, so it stays a single
 * component rather than being re-typed per section.
 */
export default function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.2em] text-brand-500">
      <span aria-hidden className="h-0.5 w-7 shrink-0 bg-brand-500" />
      {children}
    </span>
  );
}
