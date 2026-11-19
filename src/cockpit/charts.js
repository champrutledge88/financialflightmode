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

let chartSerial = 0;

// Glass ring: rounded, glowing segments that can be tapped. Slices under 4% fold into "Other".
export const foldSlices = (items, limit = 7, minShare = 0.04) => {
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  const kept = items.filter((item, index) => index < limit && item.value / total >= minShare);
  const rest = items.filter((item) => !kept.includes(item)).reduce((sum, item) => sum + item.value, 0);
  return rest > 0 ? [...kept, { name: "Everything else", value: rest, color: "#8E8E93", other: true }] : kept;
};

export const glassDonut = ({ slices, size = 232, stroke = 22 }) => {
  chartSerial += 1;
  const uid = `gd${chartSerial}`;
  const center = size / 2;
  const radius = center - stroke / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
  const gap = slices.length > 1 ? stroke + 5 : 0;
  let offset = 0;
  const gradients = [];
  const arcs = [];
  slices.forEach((slice, index) => {
    const arc = (slice.value / total) * circumference;
    const length = Math.max(0.01, arc - gap);
    gradients.push(`<linearGradient id="${uid}g${index}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".35" stop-color="${slice.color}"/><stop offset="1" stop-color="${slice.color}"/></linearGradient>`);
    arcs.push(`<circle class="slice" data-action="slice" data-index="${index}" cx="${center}" cy="${center}" r="${radius}" fill="none"
      stroke="url(#${uid}g${index})" stroke-width="${stroke}" stroke-linecap="round"
      stroke-dasharray="${length} ${circumference - length}" stroke-dashoffset="${-(offset + gap / 2)}"
      style="--len:${length};--circ:${circumference};--delay:${index * 70}ms" transform="rotate(-90 ${center} ${center})"><title>${escapeHtml(slice.name)}</title></circle>`);
    offset += arc;
  });
  return `<svg class="glass-donut" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="Spending by category">
    <defs>${gradients.join("")}<filter id="${uid}glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9"/></filter></defs>
    <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="var(--ring-track)" stroke-width="${stroke}" />
    <g class="donut-glow" filter="url(#${uid}glow)" opacity=".55">${arcs.join("").replace(/data-action="slice"/g, 'aria-hidden="true"').replace(/class="slice"/g, 'class="slice-glow"')}</g>
    <g class="donut-slices">${arcs.join("")}</g>
  </svg>`;
};

// Line or area chart for one or more series that share an x axis.
export const lineChart = ({ series, labels = [], width = 340, height = 150, zero = false, format = compactMoney }) => {
  chartSerial += 1;
  const uid = `lc${chartSerial}`;
  const values = series.flatMap((item) => item.values);
  if (!values.length) return "";
  const length = Math.max(...series.map((item) => item.values.length), labels.length, 2);
  let max = Math.max(...values, zero ? 0 : -Infinity);
  let min = Math.min(...values, 0);
  if (max === min) max = min + 1;
  const top = 10;
  const bottom = height - (labels.length ? 22 : 8);
  const x = (index) => (index / (length - 1)) * (width - 8) + 4;
  const y = (value) => bottom - ((value - min) / (max - min)) * (bottom - top);
  const paths = series
    .map((item, index) => {
      if (!item.values.length) return "";
      const points = item.values.map((value, position) => `${x(position).toFixed(1)},${y(value).toFixed(1)}`);
      const line = `M${points.join(" L")}`;
      const area = item.fill ? `<path d="${line} L${x(item.values.length - 1).toFixed(1)},${bottom} L${x(0).toFixed(1)},${bottom} Z" fill="url(#${uid}f${index})" />` : "";
      const dot = item.dot ? `<circle cx="${x(item.values.length - 1)}" cy="${y(item.values.at(-1))}" r="4.5" fill="${item.color}" stroke="var(--surface)" stroke-width="2"/>` : "";
      return `<defs><linearGradient id="${uid}f${index}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${item.color}" stop-opacity=".35"/><stop offset="1" stop-color="${item.color}" stop-opacity="0"/></linearGradient></defs>
        ${area}<path class="line${item.dashed ? " line-dashed" : ""}" d="${line}" fill="none" stroke="${item.color}" stroke-width="${item.dashed ? 2 : 2.6}" stroke-linecap="round" stroke-linejoin="round" />${dot}`;
    })
    .join("");
  const zeroLine = min < 0 ? `<line class="grid zero" x1="0" x2="${width}" y1="${y(0)}" y2="${y(0)}" />` : "";
  const axis = labels
    .map((label, index) => (label ? `<text class="axis" x="${x(index)}" y="${height - 5}" text-anchor="middle">${escapeHtml(label)}</text>` : ""))
    .join("");
  return `<svg class="chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img">
    <line class="grid" x1="0" x2="${width}" y1="${top}" y2="${top}" /><text class="axis" x="${width}" y="${top + 12}" text-anchor="end">${escapeHtml(format(max))}</text>
    ${zeroLine}${paths}${axis}</svg>`;
};
