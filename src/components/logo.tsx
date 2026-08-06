export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-[0.35em] font-semibold tracking-tight ${className}`}>
      <span className="h-[0.75em] w-[0.75em] rounded-full bg-approved" aria-hidden="true" />
      Approva
    </span>
  );
}
