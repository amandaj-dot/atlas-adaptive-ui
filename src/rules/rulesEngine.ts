import type { TravelContext } from "./context";
import type { InterfaceSpec, InterfaceState, TraceEntry } from "../spec/interfaceSpec.types";
import { buildPlanningSpec } from "./rules/planningRules";
import { buildDisruptionSpec } from "./rules/disruptionRules";
import { buildReadySpec } from "./rules/readyRules";

/**
 * Determines which of the three states applies, given raw context.
 *
 * Precedence is deliberate and fixed, evaluated in this order:
 *   1. flightStatus === "cancelled"          → disruption (always wins)
 *   2. all three prep flags complete         → ready
 *   3. otherwise                             → planning
 *
 * A cancelled flight always resolves to disruption even if every prep
 * task is also complete — recovering from a cancellation matters more
 * than confirming preparation is done. This ordering is the one place
 * that decision is made; nothing downstream re-checks it.
 */
function determineState(context: TravelContext): {
  state: InterfaceState;
  trace: TraceEntry;
} {
  if (context.flightStatus === "cancelled") {
    return {
      state: "disruption",
      trace: {
        rule: "detect-disruption",
        reason: 'flightStatus="cancelled" → disruption rule fired → state="disruption" (takes precedence over ready)',
      },
    };
  }

  const allPrepComplete =
    context.travelNoticeComplete &&
    context.cardReadinessComplete &&
    context.currencyPrepComplete;

  if (allPrepComplete) {
    return {
      state: "ready",
      trace: {
        rule: "detect-ready",
        reason:
          "travelNoticeComplete=true, cardReadinessComplete=true, currencyPrepComplete=true, flightStatus≠cancelled → ready rule fired → state changed from \"planning\" to \"ready\"",
      },
    };
  }

  return {
    state: "planning",
    trace: {
      rule: "determine-state",
      reason: `flightStatus="${context.flightStatus}" and prep tasks incomplete → state=planning`,
    },
  };
}

/**
 * Pure function: TravelContext → InterfaceSpec. No React, no I/O.
 * This is the deterministic rules layer described in the architecture —
 * it can be unit tested directly, and its trace output is what the
 * Decision Inspector renders.
 */
export function deriveInterfaceSpec(context: TravelContext): InterfaceSpec {
  const { state, trace: stateTrace } = determineState(context);

  if (state === "planning") {
    const { intent, sections, trace } = buildPlanningSpec(context);
    return {
      state,
      intent,
      sections,
      trace: [stateTrace, ...trace],
    };
  }

  if (state === "disruption") {
    const { intent, sections, trace } = buildDisruptionSpec(context);
    return {
      state,
      intent,
      sections,
      trace: [stateTrace, ...trace],
    };
  }

  const { intent, sections, trace } = buildReadySpec(context);
  return {
    state,
    intent,
    sections,
    trace: [stateTrace, ...trace],
  };
}
