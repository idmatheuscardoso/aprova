export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`font-semibold tracking-tight ${className}`}>
      Ap<span className="text-approved">p</span>rova
    </span>
  );
}
