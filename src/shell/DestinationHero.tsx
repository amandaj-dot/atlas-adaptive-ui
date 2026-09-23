import type { InterfaceState } from "../spec/interfaceSpec.types";
import destinationImage from "../assets/destination-japan.jpg";
import "./DestinationHero.css";

type DestinationHeroProps = {
  state: InterfaceState;
};

/**
 * The destination canvas — the supplied photograph, used directly
 * (no redraw/trace/recreation). Purely decorative page chrome, not part
 * of the component registry: it carries no information of its own.
 * Destination/date/route text still comes entirely from the
 * registry-rendered SectionHeader/DetailCard sections that sit on top
 * of or beside it.
 *
 * Richness is state-driven through composition (height + overlay), not
 * by swapping images: full presence in Planning/Ready, substantially
 * reduced in Disruption because the user's intent has shifted from
 * anticipation/reference to recovery.
 */
export function DestinationHero({ state }: DestinationHeroProps) {
  return (
    <div className="destination-hero" data-state={state} aria-hidden="true">
      <img
        src={destinationImage}
        alt=""
        className="destination-hero__image"
      />
      <div className="destination-hero__scrim" />
    </div>
  );
}
