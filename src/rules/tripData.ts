/**
 * TripData holds stable trip FACTS — destination, dates, flight route,
 * hotel — that exist independently of Planning/Disruption/Ready. This is
 * deliberately separate from TravelContext, which stays responsible only
 * for adaptive/contextual signals (flightStatus, daysUntilTrip, prep
 * completion).
 *
 * Why this exists: previously, hotel information was hardcoded only
 * inside readyRules.ts, with no shared source. That made it look like
 * completing preparation tasks caused the system to "learn" the user's
 * hotel — a state-precedence bug in the information model, not just a
 * content gap. Every rule module now reads the SAME TripData constant;
 * which facts get rendered, and how prominently, is a per-state
 * decision, but the facts themselves don't appear or disappear based on
 * state.
 *
 * This is plain static data, not React state and not user/LLM input —
 * no Zod schema is needed here the way TravelContext and InterfaceSpec
 * have one; it isn't validated at a boundary because nothing produces
 * it dynamically.
 */
export type TripData = {
  /** Full destination name, used in Planning's hero headline. */
  destination: string;
  /** Short destination name, used in the quiet trip-context eyebrow. */
  destinationShort: string;
  tripDates: string;
  flightRoute: string;
  flightDateTime: string;
  hotelName: string;
  hotelDates: string;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const monthDay = (date: Date) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);

const dateRange = (start: Date, end: Date) =>
  start.getFullYear() !== end.getFullYear()
    ? `${monthDay(start)}, ${start.getFullYear()}–${monthDay(end)}, ${end.getFullYear()}`
    : start.getMonth() === end.getMonth()
      ? `${monthDay(start)}–${end.getDate()}, ${end.getFullYear()}`
      : `${monthDay(start)}–${monthDay(end)}, ${end.getFullYear()}`;

// Keep this sample itinerary 24 days in the future whenever the demo opens.
// The System panel can simulate a different countdown without changing the
// stable itinerary facts shown across all three interface states.
const departure = addDays(new Date(), 24);
const returnDate = addDays(departure, 8);
const hotelCheckIn = addDays(departure, 1);

export const tripData: TripData = {
  destination: "Mount Fuji, Japan",
  destinationShort: "Mount Fuji",
  tripDates: dateRange(departure, returnDate),
  flightRoute: "JFK → HND",
  flightDateTime: `${monthDay(departure)} · 1:25 PM`,
  hotelName: "Lake Kawaguchi",
  hotelDates: dateRange(hotelCheckIn, returnDate),
};
