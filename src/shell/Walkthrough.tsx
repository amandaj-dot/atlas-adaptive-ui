import { useEffect, useState } from "react";
import type { InterfaceState } from "../spec/interfaceSpec.types";
import "./Walkthrough.css";

type WalkthroughProps = {
  step: number;
  state: InterfaceState;
  inspectorOpen: boolean;
  governanceBlocked: boolean;
  onStepChange: (step: number) => void;
  onComplete: () => void;
};

type Spotlight = { top: number; left: number; width: number; height: number; placement: "top" | "bottom" };

export function Walkthrough({ step, state, inspectorOpen, governanceBlocked, onStepChange, onComplete }: WalkthroughProps) {
  const [spotlight, setSpotlight] = useState<Spotlight | null>(null);

  useEffect(() => {
    const taskRegion = '[data-section-id="travel-notice"], [data-section-id="card-readiness"], [data-section-id="currency-prep"]';
    const selector = [
      taskRegion,
      state === "ready" ? '[data-section-id="header"]' : taskRegion,
      '.flight-status-inline',
      inspectorOpen
        ? '[data-walkthrough-target="decision-trace"], .decision-inspector__meta'
        : '.system-inspector-trigger',
      '[data-walkthrough-target="governance-result"]',
    ][step];
    const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));
    const first = elements[0];
    if (!first) {
      const frame = window.requestAnimationFrame(() => setSpotlight(null));
      return () => window.cancelAnimationFrame(frame);
    }

    if (step !== 3 || inspectorOpen) first.scrollIntoView({ behavior: "smooth", block: "center" });

    const measure = () => {
      const visible = elements.filter((element) => element.getClientRects().length);
      if (!visible.length) return;
      const bounds = visible.map((element) => element.getBoundingClientRect());
      const left = Math.min(...bounds.map((rect) => rect.left));
      const top = Math.min(...bounds.map((rect) => rect.top));
      const right = Math.max(...bounds.map((rect) => rect.right));
      const bottom = Math.max(...bounds.map((rect) => rect.bottom));
      const inset = 6;
      setSpotlight({
        left: left - inset,
        top: top - inset,
        width: right - left + inset * 2,
        height: bottom - top + inset * 2,
        placement: top > window.innerHeight - bottom ? "top" : "bottom",
      });
    };

    const frame = window.requestAnimationFrame(measure);
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    const afterTransition = window.setTimeout(measure, 300);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
      window.clearTimeout(afterTransition);
      window.cancelAnimationFrame(frame);
    };
  }, [step, state, inspectorOpen, governanceBlocked]);

  const steps = [
    { title: "Preparing for your trip", copy: "Atlas starts by helping you get ready for the trip. Complete all three preparation tasks." },
    {
      title: "Ready to go",
      copy: "You’re set. Atlas brings the most relevant trip information and next actions forward.",
    },
    {
      title: "Travel plans changed",
      copy: "Set the flight status to Cancelled to see Atlas shift into recovery and prioritize your next steps.",
    },
    {
      title: "System transparency",
      copy: "Open System to see how Atlas interpreted the current context, which rules were triggered, and why the interface changed.",
    },
    {
      title: "Governance",
      copy: "Try the predefined unsupported request. Atlas checks the approved component registry and preserves the current interface when the request falls outside its allowed patterns.",
    },
  ];

  return (
    <div className="walkthrough" aria-label="Atlas walkthrough">
      {spotlight && (
        <div
          className="walkthrough__spotlight"
          aria-hidden="true"
          style={{ top: spotlight.top, left: spotlight.left, width: spotlight.width, height: spotlight.height }}
        />
      )}
      <section className={`walkthrough__card walkthrough__card--${spotlight?.placement ?? "bottom"}${inspectorOpen ? " walkthrough__card--inspector" : ""}`} aria-live="polite">
        <div className="walkthrough__eyebrow">Walkthrough · {step + 1} of 5</div>
        <h2>{steps[step].title}</h2>
        <p>{steps[step].copy}</p>
        <div className="walkthrough__controls">
          <button type="button" className="walkthrough__skip" onClick={onComplete}>Skip</button>
          <div className="walkthrough__navigation">
            <button type="button" onClick={() => onStepChange(step - 1)} disabled={step === 0}>Previous</button>
            <button type="button" className="walkthrough__next" onClick={() => step === 4 ? onComplete() : onStepChange(step + 1)}>
              {step === 4 ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
