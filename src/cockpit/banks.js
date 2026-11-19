import { SUPPORTED_BANK_NAMES } from "./bankFormats.js";

// Plain guidance for getting a CSV out of a bank. Menus change often, so the steps
// describe what to look for rather than promising an exact path.

export const EXPORT_STEPS = Object.freeze([
  "Sign in to your bank on its website. Many banking apps cannot export files, so Safari on your iPhone or a computer works best.",
  "Open the account and go to its transactions or activity.",
  "Look for Download, Export, or a download icon near the transaction list.",
  "Choose CSV. Some banks call it Spreadsheet, Excel CSV, or Comma Delimited.",
  "Pick a date range. Three months or more lets Cockpit learn your paydays and bills.",
  "Come back to Cockpit, tap Import, and choose the file from Downloads in the Files app.",
]);

export const BANK_HINTS = Object.freeze({
  "Apple Card": "In the Wallet app, open Apple Card, tap Card Balance, choose a monthly statement, then Export Transactions and pick CSV.",
  "Wells Fargo": "Wells Fargo files have no header row. Cockpit still recognizes them.",
  "American Express": "Amex lists purchases as positive numbers. Cockpit flips them for you.",
  Discover: "Discover lists purchases as positive numbers. Cockpit flips them for you.",
});

export const SUPPORTED_BANKS = Object.freeze([...SUPPORTED_BANK_NAMES, "Wells Fargo"].sort((a, b) => a.localeCompare(b)));
