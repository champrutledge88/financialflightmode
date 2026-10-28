export const parseCurrency = value => {
  const raw = String(value).replace(/[$,\s]/g, '');
  if (!raw || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw)) return NaN;
  return Number(raw);
};
export const formatCurrencyInput = value => {
  const raw = String(value).replace(/,/g, '');
  if (!/^\d*(\.\d{0,2})?$/.test(raw)) return null;
  const [whole, decimal] = raw.split('.');
  return (whole ? Number(whole).toLocaleString('en-US') : '') + (decimal !== undefined ? `.${decimal}` : '');
};
export const paycheckToMonthly = (amount, frequency) => amount * ({ weekly: 52 / 12, biweekly: 26 / 12, twice: 2, monthly: 1 }[frequency] ?? 1);
export const moneyError = (value, field) => !Number.isFinite(value) || value < 0 ? 'Enter zero or a higher number. An estimate is okay.' : field === 'income' && value <= 0 ? 'Enter monthly take home income to calculate your score.' : '';
