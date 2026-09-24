import React from 'react';

interface AlawasiLogoProps {
  className?: string;
  variant?: 'full' | 'emblem' | 'compact' | 'hero' | 'centerpiece';
  showSubtitle?: boolean;
}

export const AlawasiLogo: React.FC<AlawasiLogoProps> = ({
  className = '',
  variant = 'compact',
  showSubtitle = true,
}) => {
  // 1. Exact Vector Emblem from official brand identity with enhanced clarity
  const Emblem = ({
    sizeClass = 'w-12 h-7',
    useDropShadow = false,
  }: {
    sizeClass?: string;
    useDropShadow?: boolean;
  }) => (
    <div className={`relative flex flex-col items-center select-none ${sizeClass}`}>
      <svg
        viewBox="0 0 600 230"
        className="w-full h-full"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="alawasi-shadow" x="-8%" y="-8%" width="116%" height="120%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.45" />
          </filter>
        </defs>

        <g filter={useDropShadow ? "url(#alawasi-shadow)" : undefined}>
          {/* Outer rectangular border with opening for ALAWASI text */}
          <path
            d="M 215 175 H 25 V 20 H 575 V 175 H 385"
            stroke="currentColor"
            strokeWidth="8.5"
            strokeLinecap="square"
            fill="none"
          />

          {/* ALAWASI Lettermark in bottom gap */}
          <text
            x="300"
            y="182"
            textAnchor="middle"
            fill="currentColor"
            fontFamily="'Montserrat', 'Inter', system-ui, sans-serif"
            fontSize="16.5"
            fontWeight="900"
            letterSpacing="8"
          >
            ALAWASI
          </text>

          {/* Underline beneath ALAWASI */}
          <line
            x1="242"
            y1="199"
            x2="358"
            y2="199"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Geometric Kufic "الأواسي" — Crystal clear geometric pillars & cuts */}
          {/* 3 Right Solid Vertical Pillars (ا ل أ) */}
          <rect x="522" y="36" width="30" height="120" rx="1" />
          <rect x="476" y="36" width="30" height="120" rx="1" />
          <rect x="430" y="36" width="30" height="120" rx="1" />

          {/* Bottom connecting baseline */}
          <rect x="44" y="138" width="364" height="18" rx="1" />

          {/* Waw (و) stem & loop */}
          <rect x="376" y="36" width="28" height="120" rx="1" />
          <path
            fillRule="evenodd"
            d="M 320 36 H 404 V 100 H 320 Z M 346 56 H 378 V 80 H 346 Z"
          />

          {/* Alif (ا) */}
          <rect x="274" y="36" width="26" height="120" rx="1" />

          {/* Seen (س) teeth */}
          <rect x="226" y="36" width="24" height="120" rx="1" />
          <rect x="180" y="36" width="24" height="120" rx="1" />

          {/* Yaa (ي) left block & dot cutouts */}
          <rect x="44" y="36" width="28" height="120" rx="1" />
          <path
            fillRule="evenodd"
            d="M 44 36 H 156 V 100 H 44 Z M 68 56 H 96 V 80 H 68 Z M 108 56 H 136 V 80 H 108 Z"
          />
        </g>
      </svg>
    </div>
  );

  // 2. Standalone Emblem Variant
  if (variant === 'emblem') {
    return <Emblem sizeClass={className || 'w-16 h-10'} />;
  }

  // 3. Centerpiece Typography Variant (أكاديمية in Yellow, الأواسي in White)
  if (variant === 'centerpiece') {
    return (
      <div className={`flex flex-col items-center justify-center text-center select-none gap-2 ${className}`}>
        <span
          className="text-[#FFC425] dark:text-[#FBBF24] font-black leading-snug drop-shadow-sm tracking-normal"
          style={{ fontFamily: "'Cairo', 'Alexandria', system-ui, sans-serif", fontSize: '2.4rem', fontWeight: 900 }}
        >
          أكاديمية
        </span>
        <span
          className="text-white drop-shadow-md font-black leading-snug tracking-wider"
          style={{ fontFamily: "'Cairo', 'Alexandria', system-ui, sans-serif", fontSize: '3.4rem', fontWeight: 1000 }}
        >
          الأواسي
        </span>
      </div>
    );
  }

  // 4. Full Poster / Card Variant (1:1 replica of the official image provided)
  if (variant === 'full' || variant === 'hero') {
    return (
      <div className={`w-full max-w-sm aspect-square rounded-3xl bg-radial from-[#2482ce] via-[#145d9e] to-[#0a3560] border-2 border-white/20 shadow-2xl p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden alawasi-blueprint-grid text-white select-none ${className}`}>
        {/* Soft Radial Ambient Lights */}
        <div className="absolute top-1/4 -left-12 w-48 h-48 bg-sky-300/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-2 right-2 w-44 h-44 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top-Right Official Emblem Box */}
        <div className="flex justify-end relative z-10">
          <div className="text-white hover:opacity-95 transition-opacity">
            <Emblem sizeClass="w-24 h-14 sm:w-28 sm:h-16" useDropShadow={true} />
          </div>
        </div>

        {/* Main Center Calligraphy: أكاديمية (Yellow) + الأواسي (White) with maximum clarity */}
        <div className="flex flex-col items-center justify-center text-center my-auto py-2 relative z-10 gap-2 sm:gap-3">
          <h2
            className="text-[#FFC425] font-black leading-snug drop-shadow-md"
            style={{
              fontFamily: "'Cairo', 'Alexandria', sans-serif",
              fontSize: 'clamp(2.2rem, 7vw, 2.9rem)',
              fontWeight: 900,
              letterSpacing: '0.02em'
            }}
          >
            أكاديمية
          </h2>
          <h1
            className="text-white font-black leading-snug drop-shadow-xl"
            style={{
              fontFamily: "'Cairo', 'Alexandria', sans-serif",
              fontSize: 'clamp(3rem, 9.5vw, 4.2rem)',
              fontWeight: 900,
              letterSpacing: '0.04em'
            }}
          >
            الأواسي
          </h1>
        </div>

        {/* Bottom Social Media Bar */}
        <div className="flex items-center justify-center gap-2.5 py-1.5 px-4 rounded-full bg-blue-950/60 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold tracking-wider mx-auto relative z-10 shadow-md">
          {/* Social Icons */}
          <div className="flex items-center gap-1.5 text-white/90">
            {/* TikTok */}
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 2.89 3.5 2.77 1.81-.02 3.27-1.54 3.29-3.37.02-3.82 0-7.65.01-11.47.02-2.39.01-4.79.01-7.18z"/>
            </svg>
            {/* Telegram */}
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.16l-1.97 9.28c-.15.65-.53.81-1.08.5l-3-2.21-1.45 1.39c-.16.16-.3.3-.61.3l.21-3.06 5.57-5.03c.24-.22-.05-.34-.38-.13l-6.88 4.33-2.97-.93c-.65-.2-.66-.65.13-.96l11.6-4.47c.54-.2 1.01.13.83.99z"/>
            </svg>
            {/* X / Twitter */}
            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            {/* Instagram */}
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            {/* Facebook */}
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.597 0 9 1.583 9 4.615V8z"/>
            </svg>
          </div>
          <span className="w-1 h-1 rounded-full bg-white/40" />
          <span className="font-extrabold uppercase tracking-widest text-[10px]">
            ALAWASI | UofK B99
          </span>
        </div>
      </div>
    );
  }

  // 5. Compact Lockup for Navbar and Header (Harmonious Single Line)
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Visual Emblem Badge in Royal Blue */}
      <div className="flex items-center justify-center p-1.5 rounded-xl bg-gradient-to-br from-[#1E77C1] to-[#125899] text-white shadow-md shadow-blue-950/20 border border-blue-400/30 group-hover:scale-105 transition-transform duration-150 shrink-0">
        <Emblem sizeClass="w-9 h-5 sm:w-11 sm:h-6" />
      </div>

      {/* Brand Title Lockup on Single Unified Line */}
      <div className="flex items-center gap-2 whitespace-nowrap">
        <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 dark:text-white leading-none">
          AWASI <span className="text-blue-600 dark:text-amber-400">QUIZWEB</span>
        </span>
      </div>
    </div>
  );
};
