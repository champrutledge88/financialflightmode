import { dayNumber } from "./dates.js";

// Medals reward the habits Financial Flight Mode teaches: know your numbers,
// plan before payday, review weekly, correct one thing at a time.
// Every medal is earned from the person's own data and activity on this device.

const tierOf = (value, [bronze, silver, gold]) => {
  if (value >= gold) return "gold";
  if (value >= silver) return "silver";
  if (value >= bronze) return "bronze";
  return null;
};

const longestStreak = (values, test) => {
  let best = 0;
  let current = 0;
  for (const value of values) {
    current = test(value) ? current + 1 : 0;
    best = Math.max(best, current);
  }
  return best;
};

// Weekly review streak: consecutive weeks (ending this week or last week) with a completed review.
// Weeks run Monday through Sunday. Day zero (1970-01-01) was a Thursday.
export const weekIndex = (isoDay) => Math.floor((dayNumber(isoDay) + 3) / 7);

export const reviewStreak = (reviewDates, today) => {
  const weeks = new Set(reviewDates.map(weekIndex));
  const thisWeek = weekIndex(today);
  let cursor = weeks.has(thisWeek) ? thisWeek : thisWeek - 1;
  let streak = 0;
  while (weeks.has(cursor)) {
    streak += 1;
    cursor -= 1;
  }
  return streak;
};

export const MEDALS = Object.freeze([
  {
    id: "preflight",
    name: "Pre Flight Complete",
    description: "Import your first statement.",
    tiers: ["1 import", "3 imports", "12 imports"],
    measure: ({ activity }) => ({ value: activity.imports, thresholds: [1, 3, 12] }),
  },
  {
    id: "logbook",
    name: "Logbook",
    description: "Build a history Cockpit can learn from.",
    tiers: ["30 days", "90 days", "365 days"],
    measure: ({ insights }) => ({ value: insights.range.days, thresholds: [30, 90, 365] }),
  },
  {
    id: "greenMonths",
    name: "In the Green",
    description: "Months in a row where more came in than went out.",
    tiers: ["1 month", "3 months", "6 months"],
    measure: ({ insights }) => {
      const counted = insights.months.filter((month) => month.key < insights.today.slice(0, 7));
      return { value: longestStreak(counted, (month) => month.net > 0), thresholds: [1, 3, 6] };
    },
  },
  {
    id: "keeper",
    name: "Keeper",
    description: "Average share of income you keep each month.",
    tiers: ["5%", "10%", "20%"],
    measure: ({ insights }) => ({ value: insights.monthsCounted ? insights.averages.savingsRate * 100 : 0, thresholds: [5, 10, 20] }),
  },
  {
    id: "feeFree",
    name: "Fee Free Flight",
    description: "Full months with no fees or interest charged.",
    tiers: ["1 month", "3 months", "6 months"],
    measure: ({ insights }) => {
      const counted = insights.months.filter((month) => month.key < insights.today.slice(0, 7));
      return { value: longestStreak(counted, (month) => month.fees === 0), thresholds: [1, 3, 6] };
    },
  },
  {
    id: "paydayPilot",
    name: "Payday Pilot",
    description: "Pay cycles in a row where spending stayed within the paycheck.",
    tiers: ["1 cycle", "3 cycles", "6 cycles"],
    measure: ({ insights }) => ({ value: longestStreak(insights.cycles, (cycle) => cycle.net >= 0), thresholds: [1, 3, 6] }),
  },
  {
    id: "weeklyReview",
    name: "Weekly Review",
    description: "Weeks in a row you completed your review.",
    tiers: ["1 week", "4 weeks", "12 weeks"],
    measure: ({ activity, insights }) => ({ value: reviewStreak(activity.reviews, insights.today), thresholds: [1, 4, 12] }),
  },
  {
    id: "auditor",
    name: "Subscription Auditor",
    description: "Review your recurring charges and mark what stays.",
    tiers: ["1 audit", "3 audits", "6 audits"],
    measure: ({ activity }) => ({ value: activity.audits, thresholds: [1, 3, 6] }),
  },
  {
    id: "fullPicture",
    name: "Full Picture",
    description: "Bring every account into one view.",
    tiers: ["2 accounts", "3 accounts", "5 accounts"],
    measure: ({ activity }) => ({ value: activity.accounts, thresholds: [2, 3, 5] }),
  },
  {
    id: "trainer",
    name: "Category Trainer",
    description: "Teach Cockpit how you see your spending.",
    tiers: ["1 rule", "5 rules", "15 rules"],
    measure: ({ activity }) => ({ value: activity.rules, thresholds: [1, 5, 15] }),
  },
]);

export const evaluateMedals = ({ insights, activity }) =>
  MEDALS.map((medal) => {
    const { value, thresholds } = medal.measure({ insights, activity });
    const tier = tierOf(value, thresholds);
    const nextIndex = tier === "gold" ? null : tier === "silver" ? 2 : tier === "bronze" ? 1 : 0;
    const previous = nextIndex === null ? thresholds[2] : nextIndex === 0 ? 0 : thresholds[nextIndex - 1];
    const target = nextIndex === null ? thresholds[2] : thresholds[nextIndex];
    const progress = nextIndex === null ? 1 : Math.max(0, Math.min(1, (value - previous) / (target - previous)));
    return {
      id: medal.id,
      name: medal.name,
      description: medal.description,
      tier,
      value,
      progress,
      nextGoal: nextIndex === null ? null : medal.tiers[nextIndex],
      tiers: medal.tiers,
    };
  });

export const medalCount = (medals) => medals.filter((medal) => medal.tier).length;

export const newlyEarned = (before, after) => {
  const rank = { bronze: 1, silver: 2, gold: 3 };
  const previous = new Map(before.map((medal) => [medal.id, rank[medal.tier] ?? 0]));
  return after.filter((medal) => (rank[medal.tier] ?? 0) > (previous.get(medal.id) ?? 0));
};
