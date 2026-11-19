export function moneyInput(page, field) {
 return ['needs','wants','investmentsCurrentValue'].includes(field) ? page.locator(`[data-field="${field}"] [data-row-amount]`).first() : page.locator('#'+field);
}
export async function fillMoney(page, field, amount) { await moneyInput(page,field).fill(String(amount)); }
