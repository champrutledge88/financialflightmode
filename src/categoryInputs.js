import { parseCurrency, formatCurrencyInput } from './scorecardFlow.js?v=final-review-1';

export const investmentTypes = Object.freeze({ roth: 'Roth IRA', retirement: 'Other retirement investments', brokerage: 'Brokerage investments', other: 'Other investments', cash: 'Cash or high yield savings' });
export const categoryDefaults = Object.freeze({
  needs: ['Housing (rent or mortgage)', 'Utilities', 'Insurance', 'Groceries', 'Minimum debt payments'],
  wants: ['Dining out', 'Optional subscriptions', 'Shopping'],
  investmentsCurrentValue: ['roth', 'brokerage'],
});
const isBlank = value => String(value ?? '').trim() === '';
const amountText = value => new Intl.NumberFormat('en-US', {style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(value);
const cleanLabel = value => String(value ?? '').trim().slice(0,60);

// Sum integer cents. Blank rows are unused, never an implicit completed zero answer.
export function summarizeCategoryRows(rows, { accounts = false } = {}) {
  let cents = 0, cashCents = 0, hasEntered = false;
  const details = [], cashAccounts = [];
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    if (isBlank(row.amount)) { if(row.requireAmount) return {valid:false,hasEntered,index,error:'Enter an amount for this named row, or remove it if unused.'}; continue; }
    hasEntered = true;
    const amount = parseCurrency(row.amount);
    if (!Number.isFinite(amount) || amount < 0 || amount > 1e12) return {valid:false,hasEntered,index,error:'Enter an amount from zero upward, with no more than two decimal places.'};
    const label = cleanLabel(row.label);
    if (!label && !accounts) return {valid:false,hasEntered,index,error:'Name this category so you can recognize it in your report.'};
    if (accounts && !Object.hasOwn(investmentTypes,row.kind)) return {valid:false,hasEntered,index,error:'Choose the account type.'};
    if (accounts && row.kind !== 'cash' && /\bhysa\b|high\s*yield\s*savings|\bsavings\s*account\b|\bchecking\b|^cash$/i.test(label)) {
      return {valid:false,hasEntered,index,error:'This looks like cash. Choose Cash or high yield savings so it stays out of your invested total.'};
    }
    const entry = {label: label || investmentTypes[row.kind],amount:Math.round(amount*100)/100};
    if (accounts) entry.kind = row.kind;
    if (accounts && row.kind === 'cash') { cashCents += Math.round(amount*100); cashAccounts.push(entry); }
    else { cents += Math.round(amount*100); details.push(entry); }
    if (cents > 1e14 || cashCents > 1e14) return {valid:false,hasEntered,index,error:'Check these amounts. The total is too large for this scorecard.'};
  }
  return {valid:hasEntered,hasEntered,total:cents/100,cashTotal:cashCents/100,details,cashAccounts,error:hasEntered?'':'Enter an amount in at least one row. Use zero to confirm none.'};
}

export function createCategoryEditor(field, { aggregateInput, onChange, onEnter }) {
  const accounts = field === 'investmentsCurrentValue';
  const root = document.createElement('div'); root.className = 'category-editor'; root.dataset.field = field;
  const list = document.createElement('div'); list.className = 'category-rows'; root.append(list);
  const toolbar = document.createElement('div'); toolbar.className = 'category-toolbar';
  const add = document.createElement('button'); add.type = 'button'; add.className = 'add-category'; add.textContent = accounts ? '+ Add account' : '+ Add category';
  const total = document.createElement('output'); total.className = 'category-total'; total.setAttribute('aria-live','polite');
  const cash = document.createElement('p'); cash.className = 'cash-reference-total'; cash.setAttribute('aria-live','polite'); cash.hidden = true;
  const note = document.createElement('p'); note.className = 'category-note';
  note.textContent = accounts ? 'Use nicknames only, never account numbers. Cash and high yield savings are shown separately and do not increase your invested total. Include the emergency portion once in Step 7. Listing cash here does not change that emergency balance.' : 'Leave unused categories blank. Enter zero to confirm no spending.';
  const limit = document.createElement('p'); limit.className = 'category-note'; limit.hidden = true; limit.textContent = 'This scorecard supports up to 20 rows. Combine similar items if needed.';
  toolbar.append(add); root.append(toolbar,total,cash,note,limit);
  let nextId = 1;
  const read = () => [...list.children].map(row => ({label:row.querySelector('[data-row-label]').value,amount:row.querySelector('[data-row-amount]').value,kind:row.querySelector('[data-row-kind]')?.value,requireAmount:(accounts||row.dataset.default!=='true')&&row.querySelector('[data-row-label]').value.trim()!==''}));
  const summary = () => summarizeCategoryRows(read(),{accounts});
  const refresh = (emit = true) => {
    const s = summary(); aggregateInput.value = s.valid ? s.total.toFixed(2) : '';
    const title = accounts ? 'Invested total' : field === 'needs' ? 'Monthly needs total' : 'Monthly wants total';
    total.textContent = `${title}: ${s.valid ? amountText(s.total) : s.hasEntered ? 'Check your entries' : 'Not entered'}`;
    cash.hidden = !accounts || !s.valid || s.cashAccounts.length === 0;
    cash.textContent = s.valid ? `Cash listed for reference: ${amountText(s.cashTotal)}. Excluded from investing and not added to emergency savings.` : '';
    add.disabled = list.children.length >= 20; limit.hidden = !add.disabled;
    if (emit) onChange();
  };
  const addRow = (initial = '', focus = false) => {
    if (list.children.length >= 20) return;
    const id = `${field}-row-${nextId++}`;
    const row = document.createElement('fieldset'); row.className = 'category-row'; row.dataset.default=String(Boolean(initial));
    const legend = document.createElement('legend'); legend.textContent = accounts ? 'Account' : 'Category'; row.append(legend);
    if (accounts) {
      const typeLabel = document.createElement('label'); typeLabel.textContent = 'Account type';
      const select = document.createElement('select'); select.dataset.rowKind = ''; select.id = `${id}-kind`;
      for (const [value,name] of Object.entries(investmentTypes)) {const o=document.createElement('option');o.value=value;o.textContent=name;select.append(o);}
      select.value = initial || 'other'; typeLabel.append(select); row.append(typeLabel);
      select.addEventListener('change',()=>{row.querySelector('[data-row-amount-label]').textContent=select.value==='cash'?'Cash balance today (reference only)':'Invested balance today'; updateRemoveName(); refresh();});
    }
    const nameLabel = document.createElement('label'); nameLabel.textContent = accounts ? 'Account nickname (optional)' : 'Category name';
    const name = document.createElement('input'); name.type='text';name.maxLength=60;name.autocomplete='off';name.id=`${id}-label`;name.dataset.rowLabel='';name.value=accounts?'':initial;
    name.setAttribute('aria-describedby', 'form-error'); nameLabel.append(name); row.append(nameLabel);
    if (!accounts && initial) { name.type='hidden'; nameLabel.hidden=true; legend.textContent=initial; }
    else legend.textContent = `${accounts ? 'Account' : 'Category'} ${nextId-1}`;
    const amountLabel = document.createElement('label'); amountLabel.className='category-row-amount';
    const labelText = document.createElement('span');labelText.dataset.rowAmountLabel='';labelText.textContent=accounts?'Invested balance today':'Monthly amount';
    const control=document.createElement('span');control.className='field-control';const dollar=document.createElement('b');dollar.textContent='$';dollar.setAttribute('aria-hidden','true');
    const amount=document.createElement('input');amount.type='text';amount.inputMode='decimal';amount.autocomplete='off';amount.id=`${id}-amount`;amount.dataset.rowAmount='';amount.setAttribute('aria-describedby','form-error');
    control.append(dollar,amount);amountLabel.append(labelText,control);row.append(amountLabel);
    const remove=document.createElement('button');remove.type='button';remove.className='remove-category';remove.textContent='−';
    const updateRemoveName=()=>remove.setAttribute('aria-label',`Remove ${name.value || (accounts?investmentTypes[row.querySelector('[data-row-kind]').value]:'category')}`);
    updateRemoveName();remove.onclick=()=>{const sibling=row.nextElementSibling||row.previousElementSibling;row.remove();refresh();(sibling?.querySelector('[data-row-amount]')||add).focus();};row.append(remove);
    name.addEventListener('input',()=>{updateRemoveName();refresh();});
    amount.addEventListener('input',()=>{const start=amount.selectionStart,before=amount.value,formatted=formatCurrencyInput(before);if(formatted!==null){amount.value=formatted;const pos=Math.max(0,start+formatted.length-before.length);amount.setSelectionRange(pos,pos);}amount.removeAttribute('aria-invalid');refresh();});
    list.append(row);refresh(false);if(focus)name.focus();
  };
  add.onclick = () => {addRow('',true);refresh();};
  for (const initial of categoryDefaults[field]) addRow(initial);
  root.addEventListener('keydown',event=>{if(event.key==='Enter'&&event.target.matches('input')){event.preventDefault();event.stopPropagation();const inputs=[...list.querySelectorAll('input:not([type=hidden]),select')];const next=inputs[inputs.indexOf(event.target)+1];if(next)next.focus();else onEnter();}});
  return {
    root, summary,
    validate: () => {const s=summary();if(s.valid)return true;const row=list.children[s.index??0];const input=row?.querySelector(s.error.startsWith('Name')?'[data-row-label]':s.error.startsWith('This looks')?'[data-row-kind]':'[data-row-amount]');if(input)input.setAttribute('aria-invalid','true');return {message:s.error,focus:()=> (input||add).focus()};},
    zero: () => {if(!list.children.length)addRow();for(const row of list.children){if(!accounts||row.querySelector('[data-row-kind]').value!=='cash')row.querySelector('[data-row-amount]').value='0';}refresh();},
  };
}
