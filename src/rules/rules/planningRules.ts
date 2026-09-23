import type { TravelContext } from "../context";
import type { Section, TraceEntry } from "../../spec/interfaceSpec.types";
import { PREP_TASK_FIELD } from "../taskFieldMap";
import { tripData } from "../tripData";

type PlanningResult = {
  intent: "prepare";
  sections: Section[];
  trace: TraceEntry[];
};

/**
 * Builds the Planning-state interface. Pure function: same context in,
 * same spec out, no side effects.
 *
 * Information architecture question this state answers: "what do I
 * still need to do?" — trip context up top for orientation, the stable
 * trip facts (flight, hotel — same tripData every state reads, so
 * nothing "appears" later that wasn't already known) surfaced clearly
 * within the hero, then the outstanding preparation work, which is the
 * actual point of this state and stays the dominant actionable content.
 * There is no bottom-level action button: the three TaskCards' own
 * "Mark complete" controls ARE the interaction.
 *
 * Destination/flight/hotel facts come from tripData (see
 * rules/tripData.ts) — the stable source shared by every state, not
 * hardcoded here. Only daysUntilTrip and the "Confirmed" status word are
 * context-derived ("Confirmed" is safe to state plainly here because
 * Planning only ever renders when flightStatus !== "cancelled" — see
 * rulesEngine.ts).
 */
export function buildPlanningSpec(context: TravelContext): PlanningResult {
  const trace: TraceEntry[] = [];
  const sections: Section[] = [];
  const isCloseToTrip = context.daysUntilTrip <= 7;

  sections.push({
    id: "header",
    component: "SectionHeader",
    props: {
      title: tripData.destination,
      subtitle: `${tripData.tripDates} · ${context.daysUntilTrip} days until departure`,
    },
    priority: 0,
  });
  trace.push({
    rule: "header",
    reason:
      "route and exact flight time live in the flight detail card below → trip metadata stays to trip dates and countdown, avoiding duplication",
  });

  // Stable trip facts, surfaced clearly within the hero composition —
  // same two-column Flight/Hotel treatment Ready uses, same tripData
  // values. Preparation completion has no bearing on whether these
  // facts are known or shown; only the FlightStatusControl nested under
  // Flight (see App.tsx's renderAfterSection) is context-driven.
  sections.push({
    id: "flight-detail",
    component: "DetailCard",
    props: {
      label: "Flight",
      primary: tripData.flightRoute,
      secondary: `${tripData.flightDateTime} · Confirmed`,
    },
    priority: 1,
  });
  trace.push({
    rule: "flight-detail",
    reason: `flightStatus="${context.flightStatus}" → shown as a clear, scannable detail card, composed directly into the hero`,
  });

  sections.push({
    id: "hotel-detail",
    component: "DetailCard",
    props: {
      label: "Hotel",
      primary: tripData.hotelName,
      secondary: tripData.hotelDates,
    },
    priority: 2,
  });
  trace.push({
    rule: "hotel-detail",
    reason:
      "hotel is a stable tripData fact, not something preparation completion reveals → shown alongside Flight here exactly as it will be in Ready",
  });

  sections.push({
    id: "prep-header",
    component: "SectionHeader",
    props: {
      title: "The Wanderlust Essentials",
      subtitle: "3 bespoke steps to ensure a seamless departure",
    },
    priority: 3,
  });
  trace.push({
    rule: "prep-header",
    reason:
      "introduces the task cluster below as a non-interactive heading — the TaskCards' own Mark complete controls are the interaction, not a separate button",
  });

  const prepTasks: Array<{
    id: string;
    complete: boolean;
    title: string;
    description: string;
  }> = [
    {
      id: "travel-notice",
      complete: context[PREP_TASK_FIELD["travel-notice"]],
      title: "Signal Global Transit",
      description: "Advise your issuers to ensure uninterrupted card service while abroad.",
    },
    {
      id: "card-readiness",
      complete: context[PREP_TASK_FIELD["card-readiness"]],
      title: "Verify Local Compatibility",
      description: "Confirm international transaction networks and contactless support in Japan.",
    },
    {
      id: "currency-prep",
      complete: context[PREP_TASK_FIELD["currency-prep"]],
      title: "Provision Local Capital",
      description: "Arrange backup currency for traditional boutiques and cash-only locales.",
    },
  ];

  let priority = 4;
  for (const task of prepTasks) {
    const status = task.complete
      ? "complete"
      : isCloseToTrip
      ? "urgent"
      : "incomplete";

    sections.push({
      id: task.id,
      component: "TaskCard",
      props: {
        title: task.title,
        description: task.description,
        status,
      },
      priority,
    });

    trace.push({
      rule: `task:${task.id}`,
      reason: task.complete
        ? `${task.id}Complete=true → marked complete, deprioritized`
        : isCloseToTrip
        ? `${task.id}Complete=false and daysUntilTrip(${context.daysUntilTrip}) ≤ 7 → escalated to urgent`
        : `${task.id}Complete=false and daysUntilTrip(${context.daysUntilTrip}) > 7 → shown as incomplete, not yet urgent`,
    });

    priority += 1;
  }

  return { intent: "prepare", sections, trace };
}
