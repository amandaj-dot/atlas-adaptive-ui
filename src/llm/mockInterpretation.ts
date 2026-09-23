/**
 * MOCK interpretation layer — this file does NOT call an LLM.
 *
 * It exists to prove out two contract boundaries:
 *
 * 1. natural-language input → TravelContext candidate → validated
 *    against travelContextSchema → deterministic rules engine.
 * 2. natural-language input → REQUESTED INTERFACE CAPABILITY → checked
 *    against the approved component registry → accepted only if it
 *    already exists there, never created on the fly.
 *
 * A real LLM layer would replace mockInterpretUserInput's body with an
 * actual model call, but both boundaries would still apply exactly as
 * written here — interpretation can get smarter without the governed
 * design system getting any less governed.
 */

/**
 * What the (mock or real) interpretation step can produce. `data` in the
 * "context" case is `unknown` on purpose — exactly like real LLM output,
 * it is NOT trusted or typed as TravelContext until it has passed
 * validateTravelContext.
 */
export type InterpretedOutput =
  | { kind: "context"; data: unknown }
  | { kind: "capability_request"; capability: string };

/**
 * Naive keyword-based stand-in for an LLM.
 *
 * Deliberately narrow capability detection: recognizes language asking
 * for an interactive airport map as a request for a UI CAPABILITY
 * ("AirportMap"), distinct from a context update. AirportMap is
 * intentionally NOT part of the approved component registry — this
 * exists specifically to demonstrate that interpretContext.ts must
 * reject it, not to build toward supporting it later.
 */
export function mockInterpretUserInput(input: string): InterpretedOutput {
  const normalized = input.toLowerCase();

  if (normalized.includes("map") && normalized.includes("airport")) {
    return { kind: "capability_request", capability: "AirportMap" };
  }

  const flightCancelled = normalized.includes("cancel");
  return {
    kind: "context",
    // This mock does no date/duration parsing — a real LLM would need
    // to extract or infer this from the conversation; here it's fixed
    // to match the milestone's example.
    data: {
      daysUntilTrip: 24,
      flightStatus: flightCancelled ? "cancelled" : "confirmed",
      travelNoticeComplete: false,
      cardReadinessComplete: false,
      currencyPrepComplete: false,
    },
  };
}

/**
 * Valid example: matches the milestone's worked example —
 * "My flight was cancelled and I still need to prepare for my trip."
 * Should pass validateTravelContext and, from there, enter the existing
 * deterministic pipeline unchanged.
 */
export const validMockLLMOutput = mockInterpretUserInput(
  "My flight was cancelled and I still need to prepare for my trip."
);

/**
 * Invalid example: an out-of-vocabulary flightStatus value that a
 * misbehaving or hallucinating LLM might plausibly produce. Should be
 * rejected by validateTravelContext before it ever reaches the rules
 * engine.
 */
export const invalidMockLLMOutput: InterpretedOutput = {
  kind: "context",
  data: { flightStatus: "stranded" },
};

/**
 * Capability-request example: should be recognized as requesting
 * "AirportMap", then rejected by interpretContext.ts because that
 * capability is not in the approved component registry.
 */
export const capabilityRequestMockLLMOutput = mockInterpretUserInput(
  "Show me an interactive map of nearby airports with alternative flight options."
);
