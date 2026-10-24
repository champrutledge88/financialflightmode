import { addDays, daysInMonth, monthKey, shiftMonth } from "./dates.js";

// A fictional pilot so people can explore Cockpit before importing their own statement.
// Deterministic: the same date always produces the same sample.

const seeded = (seed) => {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value ^ (value >>> 15), 0x2c1b3c6d) + 0x6d2b79f5) >>> 0;
    value ^= value >>> 13;
    return (value >>> 0) / 4294967296;
  };
};

const MONTHLY = [
  { day: 1, description: "SUNRIDGE APTS RENT ONLINE PMT", amount: 145000 },
  { day: 5, description: "NETFLIX.COM", amount: 1549 },
  { day: 9, description: "SPOTIFY USA", amount: 1199 },
  { day: 12, description: "CITY POWER & LIGHT UTILITY", amount: [9800, 14600] },
  { day: 14, description: "PLANET FITNESS CLUB FEES", amount: 2499 },
  { day: 16, description: "APPLE.COM/BILL ICLOUD", amount: 299 },
  { day: 18, description: "VERIZON WIRELESS PAYMENT", amount: 8500 },
  { day: 20, description: "HULU 877 8244858", amount: 1799 },
  { day: 22, description: "GEICO AUTO INSURANCE", amount: 14200 },
  { day: 25, description: "NAVIENT STUDENT LOAN PMT", amount: 21000 },
];

const FLEXIBLE = [
  { perWeek: 2, descriptions: ["KROGER #0412", "ALDI 77231", "TRADER JOE'S #552"], range: [5800, 14200] },
  { perWeek: 2.5, descriptions: ["CHIPOTLE 2291", "DOORDASH*THAI GARDEN", "CHICK FIL A #01923", "OLIVE GARDEN 0441"], range: [1200, 5200] },
  { perWeek: 3, descriptions: ["STARBUCKS STORE 10294", "DUTCH BROS COFFEE"], range: [475, 925] },
  { perWeek: 1, descriptions: ["SHELL OIL 57441234", "QT 0712 FUEL"], range: [3800, 5600] },
  { perWeek: 0.6, descriptions: ["AMAZON MKTPL*2K4L1", "TARGET 00012345", "AMZN MKTP US*1A2B3"], range: [1800, 8900] },
  { perWeek: 0.25, descriptions: ["CVS/PHARMACY #04411", "WALGREENS #1192"], range: [900, 3400] },
  { perWeek: 0.2, descriptions: ["AMC THEATRES 2201", "STEAM GAMES"], range: [1400, 4200] },
];

export const buildSampleStatement = (today) => {
  const random = seeded(Number(today.replace(/-/g, "")));
  const between = ([low, high]) => Math.round(low + random() * (high - low));
  const pick = (list) => list[Math.floor(random() * list.length)];
  const start = `${shiftMonth(monthKey(today), -6)}-01`;
  const rows = [];

  for (let payday = addDays(start, 4); payday <= today; payday = addDays(payday, 14)) {
    rows.push({ date: payday, description: "DIRECT DEP NORTHWIND LOGISTICS PAYROLL", amount: 198000 + between([0, 2400]) });
    rows.push({ date: addDays(payday, 1), description: "ONLINE TRANSFER TO SAVINGS XXXX4471", amount: -15000 });
  }

  for (let key = monthKey(start); key <= monthKey(today); key = shiftMonth(key, 1)) {
    for (const bill of MONTHLY) {
      const date = `${key}-${String(Math.min(bill.day, daysInMonth(key))).padStart(2, "0")}`;
      if (date < start || date > today) continue;
      const amount = Array.isArray(bill.amount) ? between(bill.amount) : bill.amount;
      rows.push({ date, description: bill.description, amount: -amount });
    }
  }

  for (let day = start; day <= today; day = addDays(day, 1)) {
    for (const habit of FLEXIBLE) {
      if (random() < habit.perWeek / 7) rows.push({ date: day, description: pick(habit.descriptions), amount: -between(habit.range) });
    }
  }

  const feeDay = addDays(today, -74);
  rows.push({ date: feeDay, description: "OVERDRAFT ITEM FEE", amount: -3500 });
  rows.push({ date: addDays(today, -40), description: "VENMO FROM J RIVERA", amount: 4500 });

  rows.sort((a, b) => a.date.localeCompare(b.date) || b.amount - a.amount);
  let balance = 60000;
  return rows.map((row) => {
    balance += row.amount;
    return { ...row, balance, bankCategory: "" };
  });
};

// The same fictional pilot written as a Chase checking export, so the real import
// path (file picker, format detection, review, duplicates) can be tested end to end.
export const buildTestCsv = (today) => {
  const lines = ["Details,Posting Date,Description,Amount,Type,Balance,Check or Slip #"];
  for (const row of [...buildSampleStatement(today)].reverse()) {
    const [year, month, day] = row.date.split("-");
    const type = row.amount < 0 ? "DEBIT" : "CREDIT";
    lines.push(`${type},${month}/${day}/${year},"${row.description}",${(row.amount / 100).toFixed(2)},${type === "DEBIT" ? "DEBIT_CARD" : "ACH_CREDIT"},${(row.balance / 100).toFixed(2)},`);
  }
  return `${lines.join("\n")}\n`;
};
