import { createPlanEmailHandler } from "../../server/flight-plan-email.mjs";

export default createPlanEmailHandler();

export const config = {
  path: "/api/email-flight-plan",
  rateLimit: { windowLimit: 3, windowSize: 180, aggregateBy: ["ip", "domain"] },
};
