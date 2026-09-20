// Illustration of a well-framed passport page: all four corners inside the frame, readable
// text, nothing cropped. Drawn with theme tokens so it works in light and dark. Not mirrored.
export function PassportExample({ label }: { label: string }) {
  return (
    <svg
      viewBox="0 0 200 140"
      role="img"
      aria-label={label}
      className="w-full max-w-64 rounded-control border border-line bg-surface-2 text-fg"
    >
      {/* the page */}
      <rect x="22" y="16" width="156" height="108" rx="8" fill="var(--surface)" stroke="currentColor" strokeOpacity="0.3" />
      {/* holder photo */}
      <rect x="34" y="30" width="40" height="50" rx="4" fill="currentColor" fillOpacity="0.1" />
      <circle cx="54" cy="47" r="9" fill="currentColor" fillOpacity="0.25" />
      <path d="M38 78c2-13 28-13 32 0" fill="currentColor" fillOpacity="0.25" />
      {/* data lines */}
      {[32, 42, 52, 62, 72].map((y, i) => (
        <rect key={y} x="86" y={y} width={i % 2 ? 62 : 74} height="5" rx="2.5" fill="currentColor" fillOpacity="0.22" />
      ))}
      {/* machine-readable zone */}
      <rect x="32" y="94" width="136" height="4" rx="2" fill="currentColor" fillOpacity="0.28" />
      <rect x="32" y="103" width="136" height="4" rx="2" fill="currentColor" fillOpacity="0.28" />
      {/* framing corners */}
      <g stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M12 30V12h18" />
        <path d="M188 30V12h-18" />
        <path d="M12 110v18h18" />
        <path d="M188 110v18h-18" />
      </g>
      {/* ok badge */}
      <circle cx="170" cy="30" r="11" fill="var(--primary)" />
      <path d="m164.5 30 4 4 7-8" stroke="var(--on-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
