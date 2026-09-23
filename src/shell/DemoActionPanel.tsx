import type { ActionId } from "../components/registry/schemas";
import { tripData } from "../rules/tripData";
import "./DemoActionPanel.css";

type DemoActionPanelProps = {
  action: ActionId;
  onClose: () => void;
};

export function DemoActionPanel({ action, onClose }: DemoActionPanelProps) {
  const title = {
    "preview-rebooking": "Rebooking preview",
    "preview-support": "Support handoff preview",
    "view-journey": "Journey details",
  }[action];

  return (
    <section className="demo-action-panel" aria-label={title} aria-live="polite">
      <div className="demo-action-panel__header">
        <h3>{title}</h3>
        <button type="button" onClick={onClose} aria-label={`Close ${title}`}>
          Close
        </button>
      </div>

      {action === "preview-rebooking" && (
        <>
          <p>This prototype demonstrates the recovery flow; it does not search live flight inventory.</p>
          <ol>
            <li>Confirm the cancellation and preserve the current itinerary.</li>
            <li>Compare replacement flights into Haneda with the airline.</li>
            <li>Choose a new arrival before updating onward plans.</li>
          </ol>
        </>
      )}

      {action === "preview-support" && (
        <>
          <p>A production support handoff would include this trip summary:</p>
          <p className="demo-action-panel__summary">
            Cancelled flight {tripData.flightRoute} on {tripData.flightDateTime}. Destination:
            {" "}{tripData.destination}. Hotel: {tripData.hotelName}, {tripData.hotelDates}.
          </p>
          <p>No support message is sent from this demo.</p>
        </>
      )}

      {action === "view-journey" && (
        <dl>
          <div><dt>Destination</dt><dd>{tripData.destination}</dd></div>
          <div><dt>Travel dates</dt><dd>{tripData.tripDates}</dd></div>
          <div><dt>Flight</dt><dd>{tripData.flightRoute} · {tripData.flightDateTime}</dd></div>
          <div><dt>Hotel</dt><dd>{tripData.hotelName} · {tripData.hotelDates}</dd></div>
        </dl>
      )}
    </section>
  );
}
