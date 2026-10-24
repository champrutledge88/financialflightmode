// Line icons drawn to sit beside SF Symbols: 24px grid, 1.8 stroke, round caps.

const icon = (body, extra = "") =>
  `<svg class="icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}>${body}</svg>`;

export const ICONS = {
  today: icon('<path d="M4 15a8 8 0 1 1 16 0"/><path d="M12 15l4.5-4.5"/><circle cx="12" cy="15" r="1.2" fill="currentColor"/><path d="M4 19h16"/>'),
  insights: icon('<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/>'),
  activity: icon('<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>'),
  medals: icon('<circle cx="12" cy="15" r="6"/><path d="M8.5 10.2L5 3h5l2 4 2-4h5l-3.5 7.2"/><path d="M12 12.5l.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2L9.1 14.6l2-.3z"/>'),
  settings: icon('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),
  plus: icon('<path d="M12 5v14"/><path d="M5 12h14"/>'),
  upload: icon('<path d="M12 15V3"/><path d="M7 8l5-5 5 5"/><path d="M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/>'),
  lock: icon('<rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
  chevron: icon('<path d="M9 6l6 6-6 6"/>', ' width="16" height="16"'),
  calendar: icon('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18"/><path d="M8 3v4"/><path d="M16 3v4"/>'),
  bolt: icon('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'),
  warning: icon('<path d="M12 3l9.5 17h-19z"/><path d="M12 10v4"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>'),
  spark: icon('<path d="M12 3v4"/><path d="M12 17v4"/><path d="M3 12h4"/><path d="M17 12h4"/><path d="M6 6l2.5 2.5"/><path d="M15.5 15.5L18 18"/><path d="M6 18l2.5-2.5"/><path d="M15.5 8.5L18 6"/>'),
  check: icon('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  search: icon('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>', ' width="18" height="18"'),
  close: icon('<path d="M6 6l12 12"/><path d="M18 6L6 18"/>', ' width="18" height="18"'),
  plane: icon('<path d="M2 16l20-8-6 12-3-5z"/><path d="M13 15l3-3"/>'),
  share: icon('<path d="M12 3v12"/><path d="M7 8l5-5 5 5"/><rect x="4" y="11" width="16" height="10" rx="2.5"/>'),
  trash: icon('<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/>'),
  download: icon('<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/>'),
  arrowUp: icon('<path d="M12 19V5"/><path d="M6 11l6-6 6 6"/>', ' width="14" height="14"'),
  arrowDown: icon('<path d="M12 5v14"/><path d="M6 13l6 6 6-6"/>', ' width="14" height="14"'),
  mail: icon('<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3.5 7l8.5 6 8.5-6"/>'),
  book: icon('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>'),
  kit: icon('<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/>'),
  people: icon('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.8"/><path d="M16 14.2a5.5 5.5 0 0 1 5.5 5.8"/>'),
  external: icon('<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>', ' width="15" height="15"'),
  file: icon('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 14h8M8 17.5h5"/>'),
  bank: icon('<path d="M3 10l9-6 9 6"/><path d="M5 10v8"/><path d="M10 10v8"/><path d="M14 10v8"/><path d="M19 10v8"/><path d="M3 21h18"/>'),
};

export const TIER_COLORS = {
  gold: ["#FFE08A", "#E9A80A"],
  silver: ["#F2F2F7", "#9A9AA2"],
  bronze: ["#F5B98A", "#B5651D"],
};

const MEDAL_GLYPHS = {
  preflight: '<path d="M30 52l40-16-12 24-6-10z" />',
  logbook: '<rect x="34" y="32" width="32" height="38" rx="4"/><path d="M41 42h18M41 50h18M41 58h11"/>',
  greenMonths: '<path d="M32 62l12-12 8 8 16-18"/><path d="M58 40h10v10"/>',
  keeper: '<rect x="32" y="38" width="36" height="28" rx="6"/><path d="M42 38v-4a8 8 0 0 1 16 0v4"/><circle cx="50" cy="52" r="3"/>',
  feeFree: '<circle cx="50" cy="50" r="17"/><path d="M38 38l24 24"/>',
  paydayPilot: '<rect x="32" y="36" width="36" height="32" rx="5"/><path d="M32 45h36M41 31v9M59 31v9"/><path d="M43 56l5 5 9-10"/>',
  weeklyReview: '<circle cx="50" cy="50" r="17"/><path d="M50 40v10l7 5"/>',
  auditor: '<circle cx="47" cy="47" r="12"/><path d="M56 56l11 11"/>',
  fullPicture: '<rect x="31" y="35" width="38" height="12" rx="4"/><rect x="31" y="53" width="38" height="12" rx="4"/>',
  trainer: '<path d="M34 50l10-10h18v18L52 68z"/><circle cx="56" cy="46" r="2.5"/>',
};

let badgeSerial = 0;

export const medalBadge = (medal, size = 88) => {
  const [light, dark] = medal.tier ? TIER_COLORS[medal.tier] : ["#3A3A3C", "#2C2C2E"];
  // Unique per render: a gradient id that also lives in a hidden screen would paint nothing.
  badgeSerial += 1;
  const id = `m_${medal.id}_${badgeSerial}`;
  const glyph = MEDAL_GLYPHS[medal.id] ?? MEDAL_GLYPHS.preflight;
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const progress = medal.tier
    ? ""
    : `<circle cx="50" cy="50" r="${radius}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"
        stroke-dasharray="${circumference}" stroke-dashoffset="${circumference * (1 - medal.progress)}" transform="rotate(-90 50 50)" />`;
  return `<svg class="medal-badge ${medal.tier ? `tier-${medal.tier}` : "locked"}" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">
    <defs>
      <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${dark}"/></linearGradient>
    </defs>
    <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(127,127,127,.18)" stroke-width="3"/>
    ${progress}
    <path d="M50 10l34.6 20v40L50 90 15.4 70V30z" fill="url(#${id})" />
    <path d="M50 16l29.4 17v34L50 84 20.6 67V33z" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="1.5"/>
    <g fill="none" stroke="${medal.tier ? "#2a1a05" : "#8E8E93"}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">${glyph}</g>
  </svg>`;
};
