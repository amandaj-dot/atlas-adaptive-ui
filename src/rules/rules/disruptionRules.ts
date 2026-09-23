import type { TravelContext } from "../context";
import type { Section, TraceEntry } from "../../spec/interfaceSpec.types";
import { tripData } from "../tripData";

type DisruptionResult = {
  intent: "recover";
  sections: Section[];
  trace: TraceEntry[];
};

/**
 * Builds the Disruption-state interface for a cancelled flight.
 *
 * Information architecture question this state answers: "what do I need
 * to fix right now?" — trip context and the cancellation message live on
 * a modest destination hero (still recognizably the same trip, not an
 * error page), then the white content area reorganizes around recovery:
 * the affected flight and its simulator lead, hotel stays visible right
 * alongside it (a stable fact, not something that disappears because
 * the flight changed), and routine prep is preserved with reassurance
 * that it wasn't reset — not just deprioritized silently.
 *
 * Flight and hotel both come from tripData, the same stable source
 * Planning and Ready use. Nothing about this state causes either fact
 * to appear or disappear — only priority, hierarchy, messaging, and
 * actions change.
 */
export function buildDisruptionSpec(context: TravelContext): DisruptionResult {
  const trace: TraceEntry[] = [];
  const sections: Section[] = [];

  trace.push({
    rule: "intent-change",
    reason: 'flightStatus="cancelled" → intent changed from "prepare" to "recover"',
  });

  // Trip context + the cancellation message live ON the (modest, ~260px)
  // destination hero — still recognizably the same trip, restrained
  // rather than a full-screen error state.
  sections.push({
    id: "trip-context",
    component: "SectionHeader",
    props: {
      title: `${tripData.destinationShort} · ${tripData.tripDates}`,
    },
    priority: 0,
  });
  trace.push({
    rule: "trip-context",
    reason: 'intent="recover" → trip context stays visible on the hero, smaller than Planning/Ready\'s, so the trip still reads as "yours" during recovery',
  });

  sections.push({
    id: "disruption-banner",
    component: "Banner",
    props: {
      tone: "alert",
      title: "Your journey is temporarily paused",
      message: "Let's refine your itinerary and get you back on track.",
    },
    priority: 1,
  });
  trace.push({
    rule: "disruption-banner",
    reason: 'flightStatus="cancelled" → the cancellation message is composed directly onto the hero, urgent but restrained — a red accent rule, not a full alert panel',
  });

  // Below the hero, on white: the affected flight (with its simulator
  // nested beneath it) and the hotel, side by side — same tripData,
  // same two-column treatment Planning/Ready use, just with a status
  // word reflecting the cancellation.
  sections.push({
    id: "flight-detail",
    component: "DetailCard",
    props: {
      label: "Flight",
      primary: tripData.flightRoute,
      secondary: `${tripData.flightDateTime} · Cancelled`,
    },
    priority: 2,
  });
  trace.push({
    rule: "flight-detail",
    reason: `flightStatus="${context.flightStatus}" → the affected flight leads the recovery content, immediately below the hero`,
  });

  sections.push({
    id: "hotel-detail",
    component: "DetailCard",
    props: {
      label: "Hotel",
      primary: tripData.hotelName,
      secondary: tripData.hotelDates,
    },
    priority: 3,
  });
  trace.push({
    rule: "hotel-detail",
    reason:
      "hotel is a stable tripData fact and stays visible during disruption — a flight cancellation doesn't make the hotel disappear, and it may be affected by the change",
  });

  sections.push({
    id: "recovery-actions",
    component: "ActionGroup",
    props: {
      actions: [
        { id: "preview-rebooking", label: "Preview rebooking steps", emphasis: "primary" },
        { id: "preview-support", label: "Preview support handoff", emphasis: "secondary" },
      ],
    },
    priority: 4,
  });
  trace.push({
    rule: "promote-recovery-actions",
    reason:
      'intent="recover" → rebooking guidance is the primary preview; support handoff is a secondary preview. Neither claims to connect to live airline or support systems',
  });

  const prepTasks: Array<{ id: string; complete: boolean; label: string }> = [
    { id: "travel-notice", complete: context.travelNoticeComplete, label: "Travel notice" },
    { id: "card-readiness", complete: context.cardReadinessComplete, label: "Card readiness" },
    { id: "currency-prep", complete: context.currencyPrepComplete, label: "Currency" },
  ];
  const incompleteCount = prepTasks.filter((t) => !t.complete).length;

  sections.push({
    id: "deprioritized-header",
    component: "SectionHeader",
    props: {
      title: "Saved Readiness Progress",
      subtitle: "Your completed preparation stays checked while you explore recovery.",
    },
    priority: 5,
  });
  trace.push({
    rule: "deprioritized-header",
    reason:
      'copy communicates that completed prep survives the cancellation within the current demo session',
  });

  sections.push({
    id: "deprioritized-prep",
    component: "StatusList",
    props: {
      items: prepTasks.map((t) => ({
        label: t.label,
        status: t.complete ? "complete" : "incomplete",
      })),
    },
    priority: 6,
  });
  trace.push({
    rule: "deprioritize-prep",
    reason: `intent="recover" → ${incompleteCount} of ${prepTasks.length} routine prep tasks preserved exactly as they were (context.travelNoticeComplete etc. are untouched by flightStatus), shown as a small, muted list below recovery`,
  });

  return { intent: "recover", sections, trace };
}
