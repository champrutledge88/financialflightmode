import { categorize } from "./categorize.js";

// Everything lives in this browser's storage on this device. Nothing is sent to
// Financial Flight Mode or anyone else. People can export a backup or erase it all.

export const STORAGE_KEY = "ffm.cockpit.v1";

export const emptyState = () => ({
  version: 1,
  accounts: [],
  transactions: [],
  overrides: {},
  activity: { imports: 0, audits: 0, reviews: [], auditDates: [] },
  settings: { balance: null, cushion: 0 },
  medals: [],
  sample: false,
});

const fnv1a = (text) => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
};

export const slugify = (name) =>
  String(name ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/ /g, "_") || "account";

const transactionFingerprint = (accountId, transaction) =>
  `${accountId}|${transaction.date}|${transaction.amount}|${transaction.description.toLowerCase().replace(/\s+/g, " ")}`;

export const mergeImport = (state, { accountName, format, transactions, importedAt }) => {
  const accountId = slugify(accountName);
  const existing = new Set(state.transactions.map((transaction) => transaction.id));
  const seen = new Map();
  const added = [];
  let duplicates = 0;

  for (const transaction of transactions) {
    const fingerprint = transactionFingerprint(accountId, transaction);
    const occurrence = seen.get(fingerprint) ?? 0;
    seen.set(fingerprint, occurrence + 1);
    const id = fnv1a(`${fingerprint}|${occurrence}`);
    if (existing.has(id)) {
      duplicates += 1;
      continue;
    }
    existing.add(id);
    added.push({
      id,
      accountId,
      date: transaction.date,
      description: transaction.description,
      amount: transaction.amount,
      balance: Number.isInteger(transaction.balance) ? transaction.balance : null,
      bankCategory: transaction.bankCategory ?? "",
    });
  }

  const accounts = state.accounts.filter((account) => account.id !== accountId);
  const previous = state.accounts.find((account) => account.id === accountId);
  accounts.push({
    id: accountId,
    name: accountName,
    formatId: format.id,
    formatName: format.name,
    kind: format.kind,
    importedAt,
    count: (previous?.count ?? 0) + added.length,
  });

  return {
    state: {
      ...state,
      sample: false,
      accounts,
      transactions: [...state.transactions, ...added],
      activity: { ...state.activity, imports: state.activity.imports + 1 },
    },
    added: added.length,
    duplicates,
  };
};

export const removeAccount = (state, accountId) => ({
  ...state,
  accounts: state.accounts.filter((account) => account.id !== accountId),
  transactions: state.transactions.filter((transaction) => transaction.accountId !== accountId),
});

export const withCategories = (state) =>
  state.transactions.map((transaction) => ({ ...transaction, category: transaction.categoryOverride ?? categorize(transaction, state.overrides) }));

export const createStore = (storage) => ({
  load() {
    try {
      const raw = storage?.getItem(STORAGE_KEY);
      if (!raw) return emptyState();
      const parsed = JSON.parse(raw);
      const base = emptyState();
      return {
        ...base,
        ...parsed,
        activity: { ...base.activity, ...parsed.activity },
        settings: { ...base.settings, ...parsed.settings },
      };
    } catch {
      return emptyState();
    }
  },
  save(state) {
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch {
      return false;
    }
  },
  clear() {
    try {
      storage?.removeItem(STORAGE_KEY);
    } catch {
      // Storage may be unavailable in private browsing; nothing to clear.
    }
  },
});

export const exportBackup = (state) => JSON.stringify({ app: "ffm-cockpit", exportedAt: new Date().toISOString(), state }, null, 2);

export const importBackup = (text) => {
  const parsed = JSON.parse(text);
  if (parsed?.app !== "ffm-cockpit" || !Array.isArray(parsed.state?.transactions)) {
    throw new Error("This file is not a Cockpit backup.");
  }
  const base = emptyState();
  return { ...base, ...parsed.state, activity: { ...base.activity, ...parsed.state.activity }, settings: { ...base.settings, ...parsed.state.settings } };
};
