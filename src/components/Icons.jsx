// Kumpulan ikon SVG sederhana (biar gak ada masalah encoding emoji)
const base = (size) => ({
  width: size,
  height: size,
  viewBox: "0 0 26 26",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
});

export const MicIcon = ({ size = 20 }) => (
  <svg {...base(size)}>
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M5 10a7 7 0 0 0 14 0" />
    <line x1="12" y1="17" x2="12" y2="22" />
  </svg>
);

export const EyeIcon = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const EyeOffIcon = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M17.94 17.94A10.5 10.5 0 0 1 12 19c-6.5 0-10-7-10-7a18.4 18.4 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.6 9.6 0 0 1 12 4c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19" />
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

export const CloseIcon = ({ size = 20 }) => (
  <svg {...base(size)}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const ChevronLeft = ({ size = 22 }) => (
  <svg {...base(size)}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export const ChevronDown = ({ size = 18 }) => (
  <svg {...base(size)}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export const ZapIcon = ({ size = 18 }) => (
  <svg {...base(size)}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

export const ChartIcon = ({ size = 18 }) => (
  <svg {...base(size)}>
    <path d="M21 12A9 9 0 1 1 12 3v9z" />
    <path d="M21 12h-9" />
  </svg>
);

export const ShieldIcon = ({ size = 18 }) => (
  <svg {...base(size)}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
