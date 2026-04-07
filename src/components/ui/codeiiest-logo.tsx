/**
 * CodeiiestLogo — the official CodeIIEST SVG mark.
 * Two SVG groups: the red CI letterform + the grey II mark.
 * Ported from codeiiest-gdsc/client/src/components/iconloader/IconLoader.jsx
 */

interface CodeiiestLogoProps {
  /** Height in px. Width scales proportionally (roughly 2.3:1 ratio). */
  size?: number;
  className?: string;
}

export function CodeiiestLogo({ size = 36, className = "" }: CodeiiestLogoProps) {
  // Original SVG viewBox ratios:
  //   "CI" group: 425 × 495  → width proportion ≈ 425/495 = 0.859
  //   "II" group: 151 × 495  → width proportion ≈ 151/495 = 0.305
  // Total combined width (with gap) ≈ (425 + 20 + 151) / 495 ≈ 1.204
  const h = size;
  const ciW  = Math.round(h * (425 / 495));
  const iiW  = Math.round(h * (151 / 495));

  return (
    <div className={`flex items-center gap-[3px] ${className}`} aria-label="CodeIIEST logo">
      {/* Red "C" mark */}
      <svg
        width={ciW}
        height={h}
        viewBox="0 0 425 495"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g id="Group120">
          <rect id="r-46"   width="425" height="40" fill="#F60000" />
          <rect id="r-48"   x="110" y="60" width="315" height="40" fill="#FF0000" />
          <rect id="r-49"   x="165" y="400" width="260" height="40" fill="#F60000" />
          <rect id="r-49_2" x="55"  y="455" width="370" height="40" fill="#671616" />
          <rect id="r-126"  x="55"  y="60"  width="40"  height="435" fill="#671616" />
          <rect id="r-129"  x="110" y="60"  width="40"  height="380" fill="#FF0000" />
          <rect id="r-123"  width="40" height="495" fill="#F60000" />
        </g>
      </svg>

      {/* Grey "II" mark */}
      <svg
        width={iiW}
        height={h}
        viewBox="0 0 151 495"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g id="Group121">
          <rect id="ri-121" width="37"  height="495" fill="#A6A6A6" />
          <rect id="ri-122" x="57"  width="37" height="495" fill="#D9D9D9" />
          <rect id="ri-123" x="114" width="37" height="495" fill="#D9D9D9" />
        </g>
      </svg>
    </div>
  );
}
