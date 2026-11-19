// Display helpers. Customer facing copy avoids hyphen and dash characters, so money that
// went out or fell short is described in words or color instead of a minus sign.

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const wholeCurrency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LONG_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const money = (cents) => currency.format(Math.abs(cents) / 100);

export const wholeMoney = (cents) => wholeCurrency.format(Math.abs(Math.round(cents / 100)));

export const compactMoney = (cents) => {
  const dollars = Math.abs(cents) / 100;
  if (dollars >= 1000000) return `$${(dollars / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (dollars >= 1000) return `$${(dollars / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `$${Math.round(dollars)}`;
};

export const signedMoney = (cents) => (cents > 0 ? `+${money(cents)}` : money(cents));

export const percent = (ratio) => `${Math.round(ratio * 100)}%`;

const parts = (isoDay) => isoDay.split("-").map(Number);

export const shortDate = (isoDay) => {
  const [, month, day] = parts(isoDay);
  return `${MONTHS[month - 1]} ${day}`;
};

export const longDate = (isoDay) => {
  const [year, month, day] = parts(isoDay);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return `${WEEKDAYS[weekday]}, ${LONG_MONTHS[month - 1]} ${day}`;
};

export const relativeDay = (isoDay, today, daysUntil) => {
  if (isoDay === today) return "Today";
  if (daysUntil === 1) return "Tomorrow";
  if (daysUntil > 1 && daysUntil < 7) {
    const [year, month, day] = parts(isoDay);
    return WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  }
  return shortDate(isoDay);
};

export const monthLabel = (key) => MONTHS[Number(key.slice(5, 7)) - 1];

export const longMonthLabel = (key) => `${LONG_MONTHS[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`;

export const dateRange = (first, last) => `${shortDate(first)}, ${first.slice(0, 4)} to ${shortDate(last)}, ${last.slice(0, 4)}`;

export const plural = (count, word, many = `${word}s`) => `${count.toLocaleString("en-US")} ${count === 1 ? word : many}`;

export const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
