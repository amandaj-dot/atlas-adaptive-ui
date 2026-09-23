type PrepTaskField = "travelNoticeComplete" | "cardReadinessComplete" | "currencyPrepComplete";

/**
 * Maps each Planning-state TaskCard's section id to the TravelContext
 * boolean field it represents. This is the ONE place that association
 * exists — planningRules.ts uses it to decide each task's status, and
 * App.tsx uses the identical mapping to know which context field to flip
 * when a TaskCard is completed from the customer-facing UI. Neither
 * consumer redeclares or guesses the association independently.
 */
export const PREP_TASK_FIELD: Record<string, PrepTaskField> = {
  "travel-notice": "travelNoticeComplete",
  "card-readiness": "cardReadinessComplete",
  "currency-prep": "currencyPrepComplete",
};
