import { parseCsv } from "./csv.js";
import { parseDate } from "./dates.js";

// Bank export recognition. Each format is a header signature plus a sign convention:
//   signed           money out is negative, money in is positive
//   chargesPositive  card exports where purchases are positive and payments negative
//   debitCredit      separate money out and money in columns
//   indicator        unsigned amount plus a column that says Debit or Credit
// Anything unrecognized falls through to generic column detection, and the import
// review lets the person flip the sign before anything is saved.

export const BANK_FORMATS = Object.freeze([
  { id: "chase-checking", name: "Chase Checking", kind: "checking", requires: ["details", "posting date", "description", "amount"], sign: "signed" },
  { id: "chase-card", name: "Chase Credit Card", kind: "card", requires: ["transaction date", "post date", "description", "category", "type", "amount"], sign: "signed" },
  { id: "apple-card", name: "Apple Card", kind: "card", requires: ["transaction date", "clearing date", "description", "merchant", "amount (usd)"], sign: "chargesPositive" },
  { id: "bofa-checking", name: "Bank of America Checking", kind: "checking", requires: ["date", "description", "amount", "running bal."], sign: "signed" },
  { id: "bofa-card", name: "Bank of America Credit Card", kind: "card", requires: ["posted date", "reference number", "payee", "amount"], sign: "signed" },
  { id: "capital-one-card", name: "Capital One Credit Card", kind: "card", requires: ["transaction date", "posted date", "card no.", "description", "debit", "credit"], sign: "debitCredit" },
  { id: "capital-one-360", name: "Capital One 360", kind: "checking", requires: ["transaction description", "transaction date", "transaction type", "transaction amount"], sign: "indicator" },
  { id: "citi", name: "Citi", kind: "card", requires: ["status", "date", "description", "debit", "credit"], sign: "debitCredit" },
  { id: "amex", name: "American Express", kind: "card", requires: ["date", "description", "amount"], anyOf: ["card member", "extended details", "appears on your statement as"], sign: "chargesPositive" },
  { id: "discover", name: "Discover", kind: "card", requires: ["trans. date", "post date", "description", "amount"], sign: "chargesPositive" },
  { id: "us-bank", name: "U.S. Bank", kind: "checking", requires: ["date", "transaction", "name", "memo", "amount"], sign: "signed" },
  { id: "pnc", name: "PNC", kind: "checking", requires: ["date", "description", "withdrawals", "deposits"], sign: "debitCredit" },
  { id: "navy-federal", name: "Navy Federal Credit Union", kind: "checking", requires: ["posting date", "amount", "credit debit indicator"], sign: "indicator" },
  { id: "ally", name: "Ally Bank", kind: "checking", requires: ["date", "time", "amount", "type", "description"], sign: "signed" },
  { id: "schwab", name: "Charles Schwab Bank", kind: "checking", requires: ["date", "status", "type", "description", "withdrawal", "deposit"], sign: "debitCredit" },
]);

export const SUPPORTED_BANK_NAMES = Object.freeze([
  ...new Set(BANK_FORMATS.map((format) => format.name.replace(/ (Checking|Credit Card)$/, ""))),
]);

const WELLS_FARGO = Object.freeze({ id: "wells-fargo", name: "Wells Fargo", kind: "checking", sign: "signed" });
const GENERIC = Object.freeze({ id: "generic", name: "Other bank or credit union", kind: "unknown", sign: "auto" });

const normalizeHeader = (value) => String(value ?? "").toLowerCase().replace(/\s+/g, " ").trim();

export const parseAmount = (raw) => {
  let value = String(raw ?? "").trim();
  if (!value) return null;

  let negative = false;
  if (/^\(.*\)$/.test(value)) {
    negative = true;
    value = value.slice(1, -1);
  }
  if (/\bDR$/i.test(value)) {
    negative = true;
    value = value.replace(/\s*DR$/i, "");
  }
  value = value.replace(/\s*CR$/i, "");
  value = value.replace(/[$,\s]/g, "").replace(/USD$/i, "");
  if (value.startsWith("-")) {
    negative = !negative;
    value = value.slice(1);
  } else if (value.startsWith("+")) {
    value = value.slice(1);
  }
  if (value.endsWith("-")) {
    negative = !negative;
    value = value.slice(0, -1);
  }
  if (!/^\d*\.?\d+$/.test(value)) return null;

  const cents = Math.round(Number(value) * 100);
  return negative ? -cents : cents;
};

const findColumn = (headers, patterns) => {
  for (const pattern of patterns) {
    const index = headers.findIndex((header) =>
      pattern instanceof RegExp ? pattern.test(header) : header === pattern,
    );
    if (index !== -1) return index;
  }
  return -1;
};

const resolveColumns = (headers) => ({
  date: findColumn(headers, [
    "transaction date",
    "trans. date",
    "date",
    "posting date",
    "posted date",
    "post date",
    /date/,
  ]),
  description: findColumn(headers, [
    "description",
    "transaction description",
    "payee",
    "name",
    "merchant",
    "details",
    /description/,
    /payee|merchant|narrative/,
    "memo",
  ]),
  amount: findColumn(headers, ["amount", "amount (usd)", "transaction amount", /amount/]),
  debit: findColumn(headers, ["debit", "withdrawals", "withdrawal", "money out", /debit amount|withdraw|outflow/]),
  credit: findColumn(headers, ["credit", "deposits", "deposit", "money in", /credit amount|deposit|inflow/]),
  balance: findColumn(headers, ["balance", "running bal.", "running balance", "runningbalance", /balance/]),
  indicator: findColumn(headers, ["credit debit indicator", "transaction type", "debit/credit", "type"]),
  category: findColumn(headers, ["category"]),
});

const looksLikeHeader = (row) => {
  const headers = row.map(normalizeHeader);
  const hasDate = headers.some((header) => header.includes("date"));
  const hasMoney = headers.some((header) => /amount|debit|credit|withdraw|deposit/.test(header));
  return hasDate && hasMoney;
};

const isWellsFargoRow = (row) =>
  row.length >= 5 && parseDate(row[0]) && parseAmount(row[1]) !== null && row[2] === "*";

export const detectFormat = (rows) => {
  if (rows.length && isWellsFargoRow(rows[0])) {
    return { format: WELLS_FARGO, headerIndex: -1, columns: { date: 0, amount: 1, description: 4, debit: -1, credit: -1, balance: -1, indicator: -1, category: -1 } };
  }

  const headerIndex = rows.slice(0, 20).findIndex(looksLikeHeader);
  if (headerIndex === -1) return null;

  const headers = rows[headerIndex].map(normalizeHeader);
  const columns = resolveColumns(headers);
  const matched = BANK_FORMATS.find(
    (format) =>
      format.requires.every((name) => headers.includes(name)) &&
      (!format.anyOf || format.anyOf.some((name) => headers.includes(name))),
  );

  return { format: matched ?? GENERIC, headerIndex, columns };
};

const PAYMENT_HINT = /payment|thank you|autopay|credit/i;

// Generic files are usually signed. Card exports that list purchases as positive
// betray themselves by showing payments as the only negative lines.
const guessChargesPositive = (pairs) => {
  if (pairs.length < 3) return false;
  const negatives = pairs.filter((pair) => pair.amount < 0);
  const positiveShare = 1 - negatives.length / pairs.length;
  return (
    positiveShare >= 0.7 &&
    negatives.length > 0 &&
    negatives.every((pair) => PAYMENT_HINT.test(pair.description))
  );
};

const signedAmount = (row, columns, sign) => {
  if (sign === "debitCredit" || (columns.amount === -1 && (columns.debit !== -1 || columns.credit !== -1))) {
    const out = columns.debit === -1 ? null : parseAmount(row[columns.debit]);
    const into = columns.credit === -1 ? null : parseAmount(row[columns.credit]);
    if (out) return -Math.abs(out);
    if (into) return Math.abs(into);
    if (out === 0 || into === 0) return 0;
    return null;
  }

  const amount = parseAmount(row[columns.amount]);
  if (amount === null) return null;

  if (sign === "indicator" && columns.indicator !== -1) {
    const indicator = String(row[columns.indicator] ?? "").toLowerCase();
    if (indicator.startsWith("debit") || indicator === "dr") return -Math.abs(amount);
    if (indicator.startsWith("credit") || indicator === "cr") return Math.abs(amount);
  }

  return amount;
};

export const readStatement = (text) => {
  const rows = parseCsv(text);
  const detected = detectFormat(rows);
  if (!detected) {
    return { ok: false, error: "We could not find a date column and an amount column in this file." };
  }

  const { format, headerIndex, columns } = detected;
  if (columns.date === -1 || (columns.amount === -1 && columns.debit === -1 && columns.credit === -1)) {
    return { ok: false, error: "We could not find a date column and an amount column in this file." };
  }

  const transactions = [];
  let skipped = 0;
  for (const row of rows.slice(headerIndex + 1)) {
    const date = parseDate(row[columns.date]);
    const amount = signedAmount(row, columns, format.sign);
    const description = (columns.description === -1 ? "" : row[columns.description]) || "Transaction";
    if (!date || amount === null) {
      skipped += 1;
      continue;
    }
    const balance = columns.balance === -1 ? null : parseAmount(row[columns.balance]);
    transactions.push({
      date,
      description: description.replace(/\s+/g, " ").trim(),
      amount,
      balance,
      bankCategory: columns.category === -1 ? "" : row[columns.category] || "",
    });
  }

  let invert = format.sign === "chargesPositive";
  if (format.sign === "auto") invert = guessChargesPositive(transactions);
  const normalized = invert
    ? transactions.map((transaction) => ({ ...transaction, amount: -transaction.amount }))
    : transactions;

  return {
    ok: normalized.length > 0,
    error: normalized.length ? null : "This file did not contain any transactions we could read.",
    format,
    inverted: invert,
    transactions: normalized,
    skipped,
  };
};
