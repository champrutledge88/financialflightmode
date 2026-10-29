// On device categorization. Rules are ordered: the first matching rule wins.
// People can teach Cockpit a merchant once and every past and future import follows it.

export const GROUPS = Object.freeze({
  essentials: "Essentials",
  lifestyle: "Lifestyle",
  financial: "Debt and Fees",
  future: "Saving and Investing",
  income: "Income",
  movement: "Transfers",
});

export const CATEGORIES = Object.freeze({
  Paycheck: { group: "income", color: "#34C759" },
  "Other Income": { group: "income", color: "#30D158" },
  Refund: { group: "income", color: "#66D4A0" },
  Transfer: { group: "movement", color: "#8E8E93" },
  "Card Payment": { group: "movement", color: "#AEAEB2" },
  Housing: { group: "essentials", color: "#E95C03" },
  Utilities: { group: "essentials", color: "#FF9F0A" },
  "Phone and Internet": { group: "essentials", color: "#FFB340" },
  Groceries: { group: "essentials", color: "#FFD60A" },
  Insurance: { group: "essentials", color: "#C9A227" },
  Fuel: { group: "essentials", color: "#D98E04" },
  Transportation: { group: "essentials", color: "#B86E00" },
  Health: { group: "essentials", color: "#FF6F61" },
  Childcare: { group: "essentials", color: "#F2A27A" },
  "Debt Payment": { group: "financial", color: "#FF453A" },
  "Fees and Interest": { group: "financial", color: "#FF2D20" },
  "Saving and Investing": { group: "future", color: "#64D2FF" },
  Dining: { group: "lifestyle", color: "#BF5AF2" },
  Coffee: { group: "lifestyle", color: "#A2845E" },
  Subscriptions: { group: "lifestyle", color: "#5E5CE6" },
  Shopping: { group: "lifestyle", color: "#FF375F" },
  Entertainment: { group: "lifestyle", color: "#DA8FFF" },
  Travel: { group: "lifestyle", color: "#40C8E0" },
  "Personal Care": { group: "lifestyle", color: "#FF8FAB" },
  "Gifts and Giving": { group: "lifestyle", color: "#FFC6D9" },
  Pets: { group: "lifestyle", color: "#C69C6D" },
  "Cash and ATM": { group: "lifestyle", color: "#98989D" },
  Other: { group: "lifestyle", color: "#636366" },
});

export const CATEGORY_NAMES = Object.freeze(Object.keys(CATEGORIES));

export const groupOf = (category) => CATEGORIES[category]?.group ?? "lifestyle";

export const isSpending = (transaction) => {
  const group = groupOf(transaction.category);
  return transaction.amount < 0 && group !== "movement" && group !== "income" && group !== "future";
};

export const isIncome = (transaction) => transaction.amount > 0 && groupOf(transaction.category) === "income";

const RULES = [
  ["Card Payment", /(credit ?card|card|cardmember|amex|discover|capital one|chase|citi|applecard|apple card).*(payment|pymt|autopay)|(payment|pymt).*(thank you|received)|autopay payment|epayment|^payment$/],
  ["Fees and Interest", /overdraft|nsf fee|insufficient funds|\bfee\b|interest charge|finance charge|late charge|service charge|atm fee|monthly maintenance/],
  ["Saving and Investing", /vanguard|fidelity|schwab brokerage|robinhood|acorns|betterment|wealthfront|stash|\bm1\b|coinbase|401k|\bira\b|to savings|savings transfer|transfer to sav/],
  ["Transfer", /transfer|xfer|zelle to|to checking|from checking|from savings|online banking transfer|venmo cashout|internal/],
  ["Paycheck", /payroll|direct dep|dir dep|salary|adp|paychex|gusto|wages|paycheck|\bpay\b.*(ppd|employer)|dfas/],
  ["Refund", /refund|return|reversal|cashback|cash back reward|statement credit/],
  ["Other Income", /deposit|interest paid|interest earned|dividend|irs treas|tax ref|venmo from|zelle from|cash app from/],
  ["Housing", /\brent\b|mortgage|apartment|apts|property mgmt|hoa|landlord|realty|homeowners assoc/],
  ["Utilities", /electric|energy|\bpower\b|\bwater\b|sewer|gas co|natural gas|utility|utilities|duke|pg&e|con ed|xcel|dominion|trash|waste/],
  ["Phone and Internet", /verizon|at&t|att\b|t mobile|tmobile|sprint|comcast|xfinity|spectrum|cox comm|frontier|mint mobile|cricket|boost mobile|google fi|starlink|internet/],
  ["Insurance", /insurance|geico|progressive|state farm|allstate|liberty mutual|usaa ins|farmers ins|nationwide|lemonade/],
  ["Debt Payment", /loan|navient|nelnet|mohela|sallie|great lakes|aidvantage|sofi|lending club|upstart|affirm|klarna|afterpay|car payment|auto pay.*(toyota|honda|ford|ally)|toyota financial|honda finance/],
  ["Subscriptions", /netflix|spotify|hulu|disney|hbo|max\.com|paramount|peacock|apple\.com\/bill|itunes|youtube premium|youtubepremium|amazon prime|prime video|audible|patreon|onlyfans|siriusxm|adobe|microsoft 365|dropbox|icloud|google storage|chatgpt|openai|claude|duolingo|nyt|subscription|membership/],
  ["Groceries", /kroger|safeway|publix|aldi|whole foods|trader joe|heb\b|h e b|wegmans|food lion|\bgiant\b|stop & shop|meijer|winco|sprouts|grocery|supermarket|\bmarket\b(?!place)|instacart|costco|sam'?s club|albertsons|piggly|harris teeter|wal ?mart grocery/],
  ["Fuel", /\bshell\b|chevron|exxon|mobil|bp\b|speedway|sunoco|valero|marathon|circle k|wawa|sheetz|quiktrip|qt \d|racetrac|gas station|fuel/],
  ["Transportation", /uber(?! eats)|lyft|parking|\btolls?\b|transit|\bmetro\b|\bmta\b|\bbart\b|amtrak|dmv|jiffy|autozone|o'?reilly|car wash/],
  ["Coffee", /starbucks|dunkin|dutch bros|peet|coffee|\bcafe\b|caribou|tim hortons/],
  ["Dining", /restaurant|grill|pizza|burger|\btaco\b|chipotle|mcdonald|wendy|chick fil|chickfil|popeyes|kfc|subway|panera|doordash|uber eats|ubereats|grubhub|postmates|sonic|arby|domino|wingstop|five guys|olive garden|applebee|ihop|denny|diner|bar & grill|sushi|\bkitchen\b/],
  ["Health", /pharmacy|cvs|walgreens|rite aid|medical|doctor|dental|dentist|clinic|hospital|\bvision\b|optical|urgent care|health|lab ?corp|quest diag|\bgym\b|planet fitness|fitness/],
  ["Childcare", /daycare|child care|childcare|preschool|tuition|school/],
  ["Entertainment", /movie|cinema|\bamc\b|regal|theater|theatre|ticketmaster|stubhub|steam|playstation|xbox|nintendo|\bgames?\b|bowling|concert/],
  ["Travel", /airline|airlines|delta air|united air|american air|southwest|jetblue|spirit air|hotel|marriott|hilton|hyatt|airbnb|vrbo|expedia|booking\.com/],
  ["Personal Care", /salon|barber|spa\b|nails|ulta|sephora|beauty/],
  ["Pets", /petco|petsmart|chewy|vet\b|veterinary|animal hosp/],
  ["Gifts and Giving", /church|donation|charity|tithe|gofundme|red cross|united way/],
  ["Cash and ATM", /\batm\b|cash withdrawal|withdrawal at/],
  ["Shopping", /amazon|amzn|target|walmart|wal mart|best buy|home depot|lowe'?s|ikea|etsy|ebay|tj ?maxx|marshalls|\bross\b|old navy|\bgap\b|nike|kohl|macy|nordstrom|dollar general|dollar tree|family dollar|shein|temu|apple store/],
];

const BANK_CATEGORY_HINTS = [
  [/groceries|supermarket/i, "Groceries"],
  [/restaurant|dining|food & drink|food and drink/i, "Dining"],
  [/gas|fuel/i, "Fuel"],
  [/travel|airfare|lodging|hotel/i, "Travel"],
  [/entertainment/i, "Entertainment"],
  [/health|medical|pharmacy/i, "Health"],
  [/bills|utilities/i, "Utilities"],
  [/shopping|merchandise/i, "Shopping"],
  [/personal/i, "Personal Care"],
  [/automotive|transportation/i, "Transportation"],
  [/fees|interest/i, "Fees and Interest"],
  [/gifts|donations/i, "Gifts and Giving"],
];

const NOISE = [
  /\b(direct dep|dir dep|payroll|online transfer to|online transfer from|transfer to|transfer from|online pmt|autopay|payment|pmt|bill|mktpl|mktp|store)\b/g,
  /\b(pos|ach|debit|credit|card|purchase|recurring|preauthorized|authorized|online|web|ppd|ccd|id|ref|trace|txn|tran|withdrawal|deposit)\b/g,
  /\b\d{2}\/\d{2}(\/\d{2,4})?\b/g,
  /#\s*\d+/g,
  /\bx{2,}\d*\b/g,
  /\*+/g,
  /\b[a-z]*\d[a-z\d]*\b/g,
  /\b(ca|ny|tx|fl|wa|il|ga|nc|va|oh|pa|az|co|nj|ma|mi|tn|in|mo|md|wi|mn|sc|al|la|ky|or|ok|ct|ut|ia|nv|ar|ms|ks|nm|ne|wv|id|hi|nh|me|ri|mt|de|sd|nd|ak|dc|vt|wy|usa|us)$/g,
];

export const merchantKey = (description) => {
  let value = String(description ?? "").toLowerCase().replace(/[^a-z0-9&'.*# ]/g, " ");
  for (const pattern of NOISE) value = value.replace(pattern, " ");
  value = value.replace(/\s+/g, " ").trim();
  const words = value.split(" ").filter(Boolean).slice(0, 3);
  return words.join(" ") || String(description ?? "").toLowerCase().trim().slice(0, 24);
};

export const displayMerchant = (description) => {
  const key = merchantKey(description);
  return key.replace(/(^|\s)([a-z])/g, (match, space, letter) => space + letter.toUpperCase());
};

export const categorize = (transaction, overrides = {}) => {
  const key = merchantKey(transaction.description);
  if (overrides[key]) return overrides[key];

  const text = ` ${String(transaction.description ?? "").toLowerCase().replace(/[-_]/g, " ")} `;
  for (const [category, pattern] of RULES) {
    if (!pattern.test(text)) continue;
    const group = groupOf(category);
    if (group === "income" && transaction.amount < 0) continue;
    if (["essentials", "lifestyle", "financial", "future"].includes(group) && transaction.amount > 0 && category !== "Saving and Investing") {
      continue;
    }
    return category;
  }

  if (transaction.bankCategory) {
    const hint = BANK_CATEGORY_HINTS.find(([pattern]) => pattern.test(transaction.bankCategory));
    if (hint && transaction.amount < 0) return hint[1];
  }

  return transaction.amount > 0 ? "Other Income" : "Other";
};
