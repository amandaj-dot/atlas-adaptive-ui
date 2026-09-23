import { z } from "zod";

/**
 * TravelContext is the input to the deterministic rules engine.
 *
 * This is also the LLM input contract: everything upstream of the rules
 * engine — the dev control panel today, an LLM interpretation step
 * later — must produce something that satisfies travelContextSchema.
 * Nothing downstream (rules engine, InterfaceSpec, components) ever
 * sees unvalidated context.
 *
 * Field classification:
 *   - daysUntilTrip            required, no default (there's no safe
 *                               guess for "how many days until the trip";
 *                               an LLM must supply or infer a real value)
 *   - flightStatus             enumerated ("confirmed" | "cancelled" |
 *                               "delayed"), optional, defaults to
 *                               "confirmed" — natural-language input
 *                               that doesn't mention the flight at all
 *                               should not be misread as a disruption
 *   - travelNoticeComplete     optional boolean, defaults to false
 *   - cardReadinessComplete    optional boolean, defaults to false
 *   - currencyPrepComplete     optional boolean, defaults to false
 *
 * The three prep flags and flightStatus default to the "nothing done /
 * nothing wrong yet" state on purpose: if an LLM extracts partial
 * information from a sentence ("my flight was cancelled"), the fields
 * it didn't mention fall back to safe defaults rather than becoming
 * `undefined` and failing validation.
 */
export const flightStatusSchema = z.enum(["confirmed", "cancelled", "delayed"]);

export const travelContextSchema = z.object({
  daysUntilTrip: z.number().int().min(0),
  flightStatus: flightStatusSchema.default("confirmed"),
  travelNoticeComplete: z.boolean().default(false),
  cardReadinessComplete: z.boolean().default(false),
  currencyPrepComplete: z.boolean().default(false),
});

/**
 * TravelContext is derived from the schema — one source of truth. Any
 * change to what the rules engine accepts happens here, in the schema,
 * and the type follows automatically.
 */
export type TravelContext = z.infer<typeof travelContextSchema>;

export type TravelContextValidationResult =
  | { valid: true; context: TravelContext }
  | { valid: false; errors: string[] };

/**
 * Validates unknown input (e.g. LLM output) against travelContextSchema.
 * This is the enforcement point for the LLM input contract: malformed
 * or out-of-vocabulary values (an unapproved flightStatus, a missing
 * required field, wrong types) are rejected here, before the rules
 * engine — which assumes valid input and does no defensive checking
 * of its own — ever runs.
 */
export function validateTravelContext(input: unknown): TravelContextValidationResult {
  const result = travelContextSchema.safeParse(input);
  if (!result.success) {
    return {
      valid: false,
      errors: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
    };
  }
  return { valid: true, context: result.data };
}

export const initialContext: TravelContext = {
  daysUntilTrip: 24,
  flightStatus: "confirmed",
  travelNoticeComplete: false,
  cardReadinessComplete: false,
  currencyPrepComplete: false,
};
