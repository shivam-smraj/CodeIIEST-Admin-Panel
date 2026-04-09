"use client";

import { useEffect, useState } from "react";

/**
 * SplashScreen — animated CodeIIEST logo intro.
 *
 * Replicates the GDSC site's IconLoader animation exactly:
 * - Horizontal bars animate scaleX(0 → 1) on entry
 * - Vertical bars animate scaleY(0 → 1) with 1s delay
 * - After 3s: the wrapper fades out + scales up (fadeout), then unmounts
 *
 * Shows once per browser session (sessionStorage flag).
 */
export function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Unmount after animation completes (3s delay + 1s fadeout)
    const t = setTimeout(() => setVisible(false), 4200);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes ci-horiz {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes ci-vert {
          from { transform: scaleY(0); }
          to   { transform: scaleY(1); }
        }
        @keyframes ci-vert-129 {
          from { height: 0; }
          to   { height: 380px; }
        }
        @keyframes ci-fadeout {
          to {
            opacity: 0;
            transform: scale(3);
            visibility: hidden;
          }
        }

        .ci-splash-wrapper {
          background: #1a1a2e;
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          position: fixed;
          inset: 0;
          z-index: 9999;
          --ci-easein:  cubic-bezier(0.8, 0, 1, 1);
          --ci-easeout: cubic-bezier(0, 0, 0, 0.8);
          animation: ci-fadeout 1s ease-out 3s forwards;
        }

        /* CI — horizontal top/bottom bars */
        #ci-r46, #ci-r48, #ci-r49_2 {
          animation: ci-horiz 1s var(--ci-easein) forwards;
          transform-origin: right;
        }
        #ci-r49 {
          animation: ci-horiz 1s var(--ci-easeout) 1s forwards;
          transform: scaleX(0);
          transform-origin: right;
        }

        /* CI — vertical bars */
        #ci-r123 {
          animation: ci-vert 1s var(--ci-easeout) 1s forwards;
          transform: scaleY(0);
          transform-origin: top;
        }
        #ci-r126 {
          animation: ci-vert 1s var(--ci-easeout) 1s forwards;
          transform: scaleY(0);
          transform-origin: bottom;
        }
        #ci-r129 {
          animation: ci-vert-129 1s var(--ci-easeout) 1s forwards;
          height: 0;
        }

        /* II — all three bars */
        #ci-ri121, #ci-ri122, #ci-ri123 {
          animation: ci-vert 1s ease-out 1s forwards;
          transform: scaleY(0);
          transform-origin: top;
        }
        #ci-ri122 {
          transform-origin: bottom;
        }
      `}</style>

      <div className="ci-splash-wrapper" role="dialog" aria-label="Loading CodeIIEST">
        {/* Red "CI" mark */}
        <svg width="180" height="210" viewBox="0 0 425 495" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g>
            <rect id="ci-r46"   width="425" height="40" fill="#F60000" />
            <rect id="ci-r48"   x="110" y="60"  width="315" height="40"  fill="#FF0000" />
            <rect id="ci-r49"   x="165" y="400" width="260" height="40"  fill="#F60000" />
            <rect id="ci-r49_2" x="55"  y="455" width="370" height="40"  fill="#671616" />
            <rect id="ci-r126"  x="55"  y="60"  width="40"  height="435" fill="#671616" />
            <rect id="ci-r129"  x="110" y="60"  width="40"  height="380" fill="#FF0000" />
            <rect id="ci-r123"  width="40" height="495" fill="#F60000" />
          </g>
        </svg>

        {/* Grey "II" mark */}
        <svg width="64" height="210" viewBox="0 0 151 495" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g>
            <rect id="ci-ri121" width="37"  height="495" fill="#A6A6A6" />
            <rect id="ci-ri122" x="57"  width="37" height="495" fill="#D9D9D9" />
            <rect id="ci-ri123" x="114" width="37" height="495" fill="#D9D9D9" />
          </g>
        </svg>
      </div>
    </>
  );
}
