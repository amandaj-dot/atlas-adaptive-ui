import type { TravelContext } from "../rules/context";

type FlightStatusControlProps = {
  value: TravelContext["flightStatus"];
  onChange: (status: TravelContext["flightStatus"]) => void;
  className?: string;
  /** Defaults to "Flight status" (ContextControlPanel's usage). The
   *  inline instance next to the flight DetailCard passes "Simulate
   *  flight status" instead — same control, same setter, different
   *  label for its different placement. */
  label?: string;
};

/**
 * The flight-status input itself — not a new state, just the one piece
 * of markup shared by ContextControlPanel and the inline quick-access
 * instance placed next to the flight information in Planning/Disruption.
 * Every caller passes the same TravelContext.flightStatus value and
 * writes through the same setter in App.tsx; this component holds no
 * state of its own.
 *
 * "delayed" stays out of the UI here too, for the same reason
 * ContextControlPanel already excludes it: the rules engine treats
 * anything other than "cancelled" as Planning, so exposing "delayed"
 * would misrepresent it as a handled state.
 */
export function FlightStatusControl({ value, onChange, className, label = "Flight status" }: FlightStatusControlProps) {
  return (
    <label className={className}>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value as TravelContext["flightStatus"])}>
        <option value="confirmed">Confirmed</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </label>
  );
}
