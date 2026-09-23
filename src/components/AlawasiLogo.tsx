import React from 'react';

interface AlawasiLogoProps {
  className?: string;
  variant?: 'full' | 'emblem' | 'compact' | 'hero';
  showSubtitle?: boolean;
}

export const AlawasiLogo: React.FC<AlawasiLogoProps> = ({
  className = '',
  variant = 'compact',
  showSubtitle = true,
}) => {
  // Pure vector SVG faithful to the official Alawasi identity (awasi.jpg)
  const Emblem = ({
    sizeClass = 'w-12 h-7',
    showAccreditation = false,
  }: {
    sizeClass?: string;
    showAccreditation?: boolean;
  }) => (
    <div className={`relative flex flex-col items-center ${sizeClass}`}>
      <svg
        viewBox={showAccreditation ? "0 0 540 280" : "0 0 540 210"}
        className="w-full h-full drop-shadow-sm select-none"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Rectangular Border with gap at bottom for "ALAWASI" */}
        <path
          d="M 160 190 L 36 190 L 36 28 L 504 28 L 504 190 L 380 190"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="square"
          fill="none"
        />

        {/* Latin lettermark centered in bottom gap */}
        <text
          x="270"
          y="196"
          textAnchor="middle"
          fill="currentColor"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="16"
          fontWeight="900"
          letterSpacing="7"
        >
          ALAWASI
        </text>

        {/* --- Inner Geometric Kufic "الأواسي" Calligraphy --- */}
        {/* Three Solid Right Vertical Pillars (ا ل ا) */}
        <rect x="448" y="44" width="28" height="130" rx="1" />
        <rect x="404" y="44" width="28" height="130" rx="1" />
        <rect x="360" y="44" width="28" height="130" rx="1" />

        {/* Continuous Bottom Connecting Baseline */}
        <rect x="56" y="152" width="304" height="22" rx="1" />

        {/* Waw (و) structure with inner cutout */}
        <rect x="314" y="44" width="26" height="130" rx="1" />
        {/* Waw loop with transparent cutout via evenodd */}
        <path
          fillRule="evenodd"
          d="M 262 44 H 340 V 122 H 262 Z M 284 66 H 318 V 100 H 284 Z"
        />

        {/* Seen (س) teeth pillars connected to baseline */}
        <rect x="220" y="44" width="24" height="130" rx="1" />
        <rect x="178" y="44" width="24" height="130" rx="1" />

        {/* Left block: Ya (ي) enclosure and the Two Square Dots (two windows side-by-side) */}
        <rect x="56" y="44" width="24" height="130" rx="1" />
        <path
          fillRule="evenodd"
          d="M 56 44 H 160 V 122 H 56 Z M 76 64 H 104 V 102 H 76 Z M 112 64 H 140 V 102 H 112 Z"
        />

        {/* Accreditation Subtitle (Included when showAccreditation is true) */}
        {showAccreditation && (
          <g>
            {/* Divider rule */}
            <line
              x1="225"
              y1="218"
              x2="315"
              y2="218"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Arabic Lines */}
            <text
              x="270"
              y="244"
              textAnchor="middle"
              fill="currentColor"
              fontFamily="'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
              fontSize="14.5"
              fontWeight="bold"
              letterSpacing="0.8"
            >
              الدفعة التاسعة والتسعون - أواسي
            </text>
            <text
              x="270"
              y="268"
              textAnchor="middle"
              fill="currentColor"
              fontFamily="'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
              fontSize="14.5"
              fontWeight="bold"
              letterSpacing="0.8"
            >
              كلية الطب - جامعة الخرطوم
            </text>
          </g>
        )}
      </svg>
    </div>
  );

  if (variant === 'emblem') {
    return <Emblem sizeClass={className || 'w-16 h-10'} />;
  }

  if (variant === 'full') {
    return <Emblem sizeClass={className || 'w-64 h-36'} showAccreditation={true} />;
  }

  if (variant === 'hero') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        {/* Emblem Card directly referencing awasi.jpg on crisp royal blue background */}
        <div className="p-4 sm:p-6 rounded-3xl bg-[#1673be] border-2 border-white/20 text-white shadow-2xl mb-4 w-full max-w-sm flex items-center justify-center">
          <Emblem sizeClass="w-full h-auto max-w-[280px]" showAccreditation={true} />
        </div>

        {/* English Brand & Platform Lockup */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-base sm:text-lg font-extrabold tracking-widest text-white uppercase">
            AWASI QUIZWEB PLATFORM
          </span>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 uppercase tracking-wider font-mono shadow-sm">
            UofK B99
          </span>
        </div>

        {showSubtitle && (
          <p className="text-xs sm:text-sm text-sky-100 max-w-md mt-2 font-medium">
            Medical Education, Board-Style Clinical Vignettes & Objective Assessment
          </p>
        )}
      </div>
    );
  }

  // Compact / Default Header Lockup
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Emblem Frame with Alawasi Royal Blue & Crisp White Icon */}
      <div className="flex items-center justify-center p-1.5 rounded-xl bg-[#1673be] text-white shadow-md shadow-blue-900/20 border border-blue-400/40 group-hover:scale-105 transition-transform duration-150">
        <Emblem sizeClass="w-10 h-6 sm:w-12 sm:h-7" />
      </div>

      {/* Brand Title Lockup */}
      <div className="flex flex-col text-left">
        <div className="flex items-center gap-1.5">
          <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 dark:text-white leading-tight">
            AWASI <span className="text-blue-600 dark:text-amber-400">QUIZWEB</span>
          </span>
          <span className="hidden sm:inline-flex text-[9px] uppercase font-extrabold px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 shadow-xs">
            PLATFORM
          </span>
        </div>
        
        {showSubtitle && (
          <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            <span className="text-blue-600 dark:text-amber-400 font-bold">الدفعة 99 · طب الخرطوم</span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
            <span className="truncate">Medical Education</span>
          </div>
        )}
      </div>
    </div>
  );
};
