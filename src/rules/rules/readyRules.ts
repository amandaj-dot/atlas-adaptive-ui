import type { TravelContext } from "../context";
import type { Section, TraceEntry } from "../../spec/interfaceSpec.types";
import { tripData } from "../tripData";

type ReadyResult = {
  intent: "confirm";
  sections: Section[];
  trace: TraceEntry[];
};

/**
 * Builds the Ready-state interface: all major prep is done, so the
 * interface stops being a task list and shifts toward useful trip
 * information instead.
 *
 * Information architecture question this state answers: "am I good to
 * go?" — a quiet trip-context line, a calm confirmation headline, then
 * concrete trip facts (flight, hotel) via DetailCard rather than generic
 * labeled chips, then a quiet readiness checklist, then one action.
 *
 * Flight and hotel come from tripData — the SAME source Planning (flight
 * only) and Disruption (flight, hotel referenced) read from. Nothing
 * about reaching Ready causes the hotel to newly exist; it was already
 * in tripData the whole time, just not prominently displayed until now.
 */
export function buildReadySpec(_context: TravelContext): ReadyResult {
  const trace: TraceEntry[] = [];
  const sections: Section[] = [];

  trace.push({
    rule: "intent-change",
    reason: 'state="ready" → intent changed from "prepare" to "confirm"',
  });

  sections.push({
    id: "trip-context",
    component: "SectionHeader",
    props: {
      title: `${tripData.destinationShort} · ${tripData.tripDates}`,
    },
    priority: 0,
  });

  sections.push({
    id: "header",
    component: "SectionHeader",
    props: {
      title: "You're Cleared En-Route",
      subtitle: "Your financial preparation is complete.",
    },
    priority: 1,
  });

  sections.push({
    id: "flight-detail",
    component: "DetailCard",
    props: {
      label: "Flight",
      primary: tripData.flightRoute,
      secondary: tripData.flightDateTime,
    },
    priority: 2,
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
    rule: "trip-details",
    reason:
      "no preparation problem remains → surfaced concrete flight and hotel details (from tripData, the same stable source every state reads) via DetailCard instead of generic labeled chips with no content behind them",
  });

  sections.push({
    id: "readiness-header",
    component: "SectionHeader",
    props: {
      title: "Readiness Profile",
    },
    priority: 4,
  });

  sections.push({
    id: "prep-confirmation",
    component: "StatusList",
    props: {
      items: [
        { label: "Global signal active", status: "complete" },
        { label: "Network verified", status: "complete" },
        { label: "Capital provisioned", status: "complete" },
      ],
    },
    priority: 5,
  });
  trace.push({
    rule: "compact-confirmation",
    reason:
      "travelNoticeComplete=true, cardReadinessComplete=true, currencyPrepComplete=true → shown as a quiet checklist confirmation, not individual TaskCards",
  });

  sections.push({
    id: "primary-action",
    component: "ActionGroup",
    props: {
      actions: [{ id: "view-journey", label: "View journey details", emphasis: "primary" }],
    },
    priority: 6,
  });
  trace.push({
    rule: "primary-action",
    reason:
      'state="ready" → one calm primary action ("View journey details"), no secondary actions competing for attention',
  });

  return { intent: "confirm", sections, trace };
}
