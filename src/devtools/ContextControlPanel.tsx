import type { TravelContext } from "../rules/context";
import { FlightStatusControl } from "./FlightStatusControl";
import "./ContextControlPanel.css";

type ContextControlPanelProps = {
  context: TravelContext;
  onChange: (context: TravelContext) => void;
};

/**
 * Stands in for the future LLM layer: it produces a TravelContext, same
 * as an intent-interpretation step would. Exposes the fields the rules
 * engine currently reacts to: flight status (drives Planning vs.
 * Disruption) and the three prep-completion flags.
 */
export function ContextControlPanel({ context, onChange }: ContextControlPanelProps) {
  function toggle(field: keyof TravelContext) {
    onChange({ ...context, [field]: !context[field] });
  }

  function setDays(days: number) {
    onChange({ ...context, daysUntilTrip: days });
  }

  return (
    <div className="control-panel">
      <p className="control-panel__heading">Context (dev control panel)</p>

      <div className="control-panel__row">
        <FlightStatusControl
          value={context.flightStatus}
          onChange={(flightStatus) => onChange({ ...context, flightStatus })}
          className="control-panel__flight-status"
        />
      </div>

      <div className="control-panel__row">
        <label htmlFor="days-until-trip">Days until trip</label>
        <input
          id="days-until-trip"
          type="number"
          min={0}
          max={90}
          value={context.daysUntilTrip}
          onChange={(e) => setDays(Number(e.target.value))}
        />
      </div>

      <div className="control-panel__row">
        <label htmlFor="travel-notice">Travel notice filed</label>
        <input
          id="travel-notice"
          type="checkbox"
          checked={context.travelNoticeComplete}
          onChange={() => toggle("travelNoticeComplete")}
        />
      </div>

      <div className="control-panel__row">
        <label htmlFor="card-readiness">Card readiness confirmed</label>
        <input
          id="card-readiness"
          type="checkbox"
          checked={context.cardReadinessComplete}
          onChange={() => toggle("cardReadinessComplete")}
        />
      </div>

      <div className="control-panel__row">
        <label htmlFor="currency-prep">Currency prepared</label>
        <input
          id="currency-prep"
          type="checkbox"
          checked={context.currencyPrepComplete}
          onChange={() => toggle("currencyPrepComplete")}
        />
      </div>
    </div>
  );
}
