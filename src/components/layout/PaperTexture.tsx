const NOISE_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

/**
 * The two fixed, full-page layers everything else sits on: a dot grid and a
 * paper-grain overlay. Both are decorative and never intercept pointer events.
 */
export default function PaperTexture() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(var(--dot) 1.4px, transparent 1.4px)",
          backgroundSize: "26px 26px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          opacity: 0.055,
          backgroundImage: `url("${NOISE_SVG}")`,
        }}
      />
    </>
  );
}
