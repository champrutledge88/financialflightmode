import { compactMoney, escapeHtml } from "./format.js";

// Small, dependency free SVG charts tuned to read like native iOS charts.

export const ring = ({ size = 132, stroke = 14, rings }) => {
  const center = size / 2;
  const parts = rings
    .map((item, index) => {
      const radius = center - stroke / 2 - index * (stroke + 4);
      const circumference = 2 * Math.PI * radius;
      const value = Math.max(0, Math.min(item.value, 1));
      return `
        <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${item.track}" stroke-width="${stroke}" />
        <circle class="ring-value" cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${item.color}" stroke-width="${stroke}"
          stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${circumference * (1 - value)}"
          style="--ring-length:${circumference}" transform="rotate(-90 ${center} ${center})" />`;
    })
    .join("");
  return `<svg class="ring" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">${parts}</svg>`;
};

export const donut = ({ size = 168, stroke = 22, slices, label = "", sublabel = "" }) => {
  const center = size / 2;
  const radius = center - stroke / 2;
  const circumference = 2 * Math.PI * radius;
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
  let offset = 0;
  const gap = slices.length > 1 ? 2 : 0;
  const arcs = slices
    .map((slice) => {
      const length = Math.max(0, (slice.value / total) * circumference - gap);
      const arc = `<circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${slice.color}" stroke-width="${stroke}"
        stroke-dasharray="${length} ${circumference - length}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${center} ${center})" />`;
      offset += (slice.value / total) * circumference;
      return arc;
    })
    .join("");
  return `<svg class="donut" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="${escapeHtml(label)} ${escapeHtml(sublabel)}">
    ${arcs}
    <text x="50%" y="47%" text-anchor="middle" class="donut-value">${escapeHtml(label)}</text>
    <text x="50%" y="61%" text-anchor="middle" class="donut-label">${escapeHtml(sublabel)}</text>
  </svg>`;
};

// Paired monthly bars: money in and money out.
export const pairedBars = ({ items, width = 340, height = 170 }) => {
  if (!items.length) return "";
  const max = Math.max(...items.flatMap((item) => [item.a, item.b]), 1);
  const bottom = height - 22;
  const slot = width / items.length;
  const bar = Math.min(16, slot / 3.2);
  const bars = items
    .map((item, index) => {
      const x = index * slot + slot / 2;
      const ha = (item.a / max) * (bottom - 12);
      const hb = (item.b / max) * (bottom - 12);
      return `
        <rect class="bar bar-in" x="${x - bar - 1}" y="${bottom - ha}" width="${bar}" height="${Math.max(ha, 2)}" rx="${Math.min(4, bar / 2)}" />
        <rect class="bar bar-out" x="${x + 1}" y="${bottom - hb}" width="${bar}" height="${Math.max(hb, 2)}" rx="${Math.min(4, bar / 2)}" />
        <text class="axis" x="${x}" y="${height - 6}" text-anchor="middle">${escapeHtml(item.label)}</text>`;
    })
    .join("");
  const grid = [0.5, 1]
    .map((share) => {
      const y = bottom - share * (bottom - 12);
      return `<line class="grid" x1="0" x2="${width}" y1="${y}" y2="${y}" /><text class="axis" x="${width}" y="${y - 4}" text-anchor="end">${compactMoney(max * share)}</text>`;
    })
    .join("");
  return `<svg class="chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="Money in and money out by month">${grid}${bars}</svg>`;
};

// Bars around a zero line: green above for cycles that ended ahead, red below for short.
export const divergingBars = ({ items, width = 340, height = 150 }) => {
  if (!items.length) return "";
  const max = Math.max(...items.map((item) => Math.abs(item.value)), 1);
  const middle = height / 2 - 8;
  const slot = width / items.length;
  const bar = Math.min(22, slot * 0.55);
  const bars = items
    .map((item, index) => {
      const x = index * slot + (slot - bar) / 2;
      const h = Math.max(2, (Math.abs(item.value) / max) * (middle - 6));
      const y = item.value >= 0 ? middle - h : middle;
      return `<rect class="bar ${item.value >= 0 ? "bar-in" : "bar-short"}" x="${x}" y="${y}" width="${bar}" height="${h}" rx="4" />
        <text class="axis" x="${x + bar / 2}" y="${height - 4}" text-anchor="middle">${escapeHtml(item.label)}</text>`;
    })
    .join("");
  return `<svg class="chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="How each pay cycle ended">
    <line class="grid zero" x1="0" x2="${width}" y1="${middle}" y2="${middle}" />${bars}</svg>`;
};

export const columnBars = ({ items, width = 340, height = 120, highlight = -1 }) => {
  const max = Math.max(...items.map((item) => item.value), 1);
  const bottom = height - 20;
  const slot = width / items.length;
  const bar = Math.min(28, slot * 0.55);
  return `<svg class="chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="Spending by day of week">${items
    .map((item, index) => {
      const h = Math.max(2, (item.value / max) * (bottom - 6));
      const x = index * slot + (slot - bar) / 2;
      return `<rect class="bar ${index === highlight ? "bar-accent" : "bar-muted"}" x="${x}" y="${bottom - h}" width="${bar}" height="${h}" rx="5" />
        <text class="axis" x="${x + bar / 2}" y="${height - 4}" text-anchor="middle">${escapeHtml(item.label)}</text>`;
    })
    .join("")}</svg>`;
};

export const stackedBar = (segments) => {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  return `<div class="stacked" role="img" aria-label="${escapeHtml(segments.map((segment) => segment.label).join(", "))}">${segments
    .filter((segment) => segment.value > 0)
    .map((segment) => `<span style="flex:${segment.value / total};background:${segment.color}"></span>`)
    .join("")}</div>`;
};
