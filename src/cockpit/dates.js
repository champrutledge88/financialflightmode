// Dates are stored as ISO day strings (YYYY-MM-DD) and compared as UTC day numbers so
// time zones and daylight saving never shift a transaction to a different day.

const DAY_MS = 86400000;

const pad = (value) => String(value).padStart(2, "0");

export const toIsoDay = (year, month, day) => {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return `${year}-${pad(month)}-${pad(day)}`;
};

export const parseDate = (raw) => {
  const value = String(raw ?? "").trim();
  if (!value) return null;

  let match = value.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (match) return toIsoDay(Number(match[1]), Number(match[2]), Number(match[3]));

  match = value.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/);
  if (match) {
    let year = Number(match[3]);
    if (year < 100) year += 2000;
    return toIsoDay(year, Number(match[1]), Number(match[2]));
  }

  match = value.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (match) return toIsoDay(Number(match[1]), Number(match[2]), Number(match[3]));

  return null;
};

export const dayNumber = (isoDay) => {
  const [year, month, day] = isoDay.split("-").map(Number);
  return Math.round(Date.UTC(year, month - 1, day) / DAY_MS);
};

export const fromDayNumber = (number) => {
  const date = new Date(number * DAY_MS);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
};

export const addDays = (isoDay, days) => fromDayNumber(dayNumber(isoDay) + days);

export const daysBetween = (fromIso, toIso) => dayNumber(toIso) - dayNumber(fromIso);

export const monthKey = (isoDay) => isoDay.slice(0, 7);

export const weekday = (isoDay) => new Date(dayNumber(isoDay) * DAY_MS).getUTCDay();

export const todayIso = (now = new Date()) =>
  `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

export const daysInMonth = (key) => {
  const [year, month] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
};

export const shiftMonth = (key, offset) => {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
};
