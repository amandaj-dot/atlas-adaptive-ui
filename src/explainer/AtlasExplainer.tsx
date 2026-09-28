import { useEffect, useRef, useState } from "react";
import { deriveInterfaceSpec } from "../rules/rulesEngine";
import type { TravelContext } from "../rules/context";
import type { InterfaceSpec } from "../spec/interfaceSpec.types";
import { validateInterfaceSpec } from "../spec/interfaceSpec.schema";
import { componentRegistry } from "../components/registry/componentRegistry";
import { SpecRenderer } from "../render/SpecRenderer";
import { DestinationHero } from "../shell/DestinationHero";
import { GovernanceTest } from "../devtools/GovernanceTest";
import { InterpretationDebugView } from "../devtools/InterpretationDebugView";
import { runPredefinedGovernanceTest } from "../llm/governanceDemo";
import type { InterpretationResult } from "../llm/interpretContext";
import "../tokens/tokens.css";
import "./AtlasExplainer.css";

type Phase = "context" | "rules" | "spec" | "validation" | "registry" | "interface";
type SceneId = "context" | "rules" | "spec" | "validation" | "registry" | "currency" | "ready" | "flight" | "disruption" | "governance" | "summary";
type Scene = {
  id: SceneId;
  duration: number;
  phase: Phase;
  input: TravelContext;
  rendered: TravelContext;
  heading: string;
  explanation: string;
  change?: "currency" | "flight";
};

const planning: TravelContext = {
  daysUntilTrip: 24,
  travelNoticeComplete: true,
  cardReadinessComplete: true,
  currencyPrepComplete: false,
  flightStatus: "confirmed",
};
const ready: TravelContext = { ...planning, currencyPrepComplete: true };
const disruption: TravelContext = { ...ready, flightStatus: "cancelled" };

// One timeline controls every scene and its dwell time. Total: 29.8 seconds.
const scenes: Scene[] = [
  { id: "context", duration: 3100, phase: "context", input: planning, rendered: planning, heading: "The context is structured data", explanation: "Atlas knows the departure timing, preparation progress, and flight status." },
  { id: "rules", duration: 2900, phase: "rules", input: planning, rendered: planning, heading: "Rules interpret those signals", explanation: "The flight is confirmed, but currency is incomplete. Planning remains the priority." },
  { id: "spec", duration: 2900, phase: "spec", input: planning, rendered: planning, heading: "Rules produce interface instructions", explanation: "An InterfaceSpec names the state, intent, sections, and their order." },
  { id: "validation", duration: 2600, phase: "validation", input: planning, rendered: planning, heading: "The specification is checked", explanation: "Zod validates its structure and each section’s props before rendering." },
  { id: "registry", duration: 2600, phase: "registry", input: planning, rendered: planning, heading: "Approved components assemble the view", explanation: "The renderer resolves each valid section through Atlas’s fixed component registry." },
  { id: "currency", duration: 1900, phase: "context", input: ready, rendered: planning, heading: "One context value changes", explanation: "Currency becomes complete. Atlas runs the same rules again before replacing the view.", change: "currency" },
  { id: "ready", duration: 2800, phase: "interface", input: ready, rendered: ready, heading: "A new specification changes the interface", explanation: "All preparation is complete, so the spec prioritizes trip details and the next action." },
  { id: "flight", duration: 1900, phase: "context", input: disruption, rendered: ready, heading: "The flight status changes", explanation: "The cancellation enters the same context object. The current view holds while rules run.", change: "flight" },
  { id: "disruption", duration: 3100, phase: "interface", input: disruption, rendered: disruption, heading: "Recovery becomes the priority", explanation: "The cancellation rule wins. A new spec promotes recovery and preserves completed prep." },
  { id: "governance", duration: 3500, phase: "registry", input: disruption, rendered: disruption, heading: "The boundary is enforced", explanation: "AirportMap is outside the registry, so the request is blocked and the valid interface remains." },
  { id: "summary", duration: 2500, phase: "interface", input: disruption, rendered: disruption, heading: "Context becomes a governed interface", explanation: "Inputs change → rules decide → a validated spec selects approved components → the interface adapts." },
];

const phases: Array<{ id: Phase; label: string }> = [
  { id: "context", label: "Context" }, { id: "rules", label: "Rules" },
  { id: "spec", label: "InterfaceSpec" }, { id: "validation", label: "Validation" },
  { id: "registry", label: "Registry" }, { id: "interface", label: "Interface" },
];

function subset(spec: InterfaceSpec, ids: string[]): InterfaceSpec {
  return { ...spec, sections: spec.sections.filter((section) => ids.includes(section.id)) };
}

function TransformationDetail({ scene, spec, result, onRun }: {
  scene: Scene;
  spec: InterfaceSpec;
  result: InterpretationResult | null;
  onRun: () => void;
}) {
  if (scene.id === "governance") return <div className="atlas-explainer__governance">
    <GovernanceTest onRun={onRun} result={result} />
    <InterpretationDebugView result={result} />
  </div>;

  if (scene.phase === "context") return <>
    <p className="atlas-explainer__detail-label">TravelContext</p>
    <dl className="atlas-explainer__data-list">
      <div><dt>daysUntilTrip</dt><dd>{scene.input.daysUntilTrip}</dd></div>
      <div><dt>travelNoticeComplete</dt><dd>{String(scene.input.travelNoticeComplete)}</dd></div>
      <div><dt>cardReadinessComplete</dt><dd>{String(scene.input.cardReadinessComplete)}</dd></div>
      <div className={scene.change === "currency" ? "atlas-explainer__changed" : ""}><dt>currencyPrepComplete</dt><dd>{String(scene.input.currencyPrepComplete)}</dd></div>
      <div className={scene.change === "flight" ? "atlas-explainer__changed" : ""}><dt>flightStatus</dt><dd>"{scene.input.flightStatus}"</dd></div>
    </dl>
    {scene.change && <p className="atlas-explainer__detail-note">Changed input → rules run again → new interface specification. The last valid view stays visible until then.</p>}
  </>;

  if (scene.phase === "rules") return <>
    <p className="atlas-explainer__detail-label">Rule priority</p>
    <ol className="atlas-explainer__data-list atlas-explainer__rule-list">
      <li><span>Flight cancelled?</span><strong>No</strong></li>
      <li><span>All prep complete?</span><strong>No</strong></li>
      <li className="atlas-explainer__rule-active"><span>Otherwise</span><strong>Planning</strong></li>
    </ol>
    <p className="atlas-explainer__detail-note">Rules evaluate the values in context and decide what matters next.</p>
  </>;

  if (scene.phase === "spec" || scene.phase === "interface") return <>
    <p className="atlas-explainer__detail-label">Derived InterfaceSpec</p>
    {scene.phase === "interface" && <p className="atlas-explainer__rule-result">{spec.state === "ready" ? "All three prep fields are true → Ready" : "flightStatus is cancelled → Disruption takes priority"}</p>}
    <dl className="atlas-explainer__data-list"><div><dt>state</dt><dd>{spec.state}</dd></div><div><dt>intent</dt><dd>{spec.intent}</dd></div></dl>
    <p className="atlas-explainer__detail-label">Sections, in priority order</p>
    <ol className="atlas-explainer__data-list atlas-explainer__section-list">
      {spec.sections.slice(0, 7).map((section) => <li key={section.id}><span>{section.id}</span><strong>{section.component}</strong></li>)}
    </ol>
    <p className="atlas-explainer__detail-note">The renderer uses these instructions to compose the interface shown beside them.</p>
  </>;

  if (scene.phase === "validation") {
    const check = validateInterfaceSpec(spec);
    return <>
      <p className="atlas-explainer__detail-label">Zod validation</p>
      <div className="atlas-explainer__check"><span>InterfaceSpec structure</span><strong>{check.valid ? "Passed ✓" : "Blocked"}</strong></div>
      <div className="atlas-explainer__check"><span>Props for every section</span><strong>{check.valid ? "Passed ✓" : "Blocked"}</strong></div>
      <p className="atlas-explainer__detail-note">Invalid state, section name, or component props cannot pass as a valid spec.</p>
    </>;
  }

  const names = [...new Set(spec.sections.map((section) => section.component))];
  return <>
    <p className="atlas-explainer__detail-label">Approved component registry</p>
    <ul className="atlas-explainer__data-list atlas-explainer__component-list">
      {names.map((name) => <li key={name}><span>{name}</span><strong>{name in componentRegistry ? "Approved ✓" : "Blocked"}</strong></li>)}
    </ul>
    <p className="atlas-explainer__detail-note">The renderer looks up each component and fills it with the validated section content.</p>
  </>;
}

export function AtlasExplainer() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState<InterpretationResult | null>(null);
  const remaining = useRef(scenes[0].duration);
  const scene = scenes[sceneIndex];
  const inputSpec = deriveInterfaceSpec(scene.input);
  const spec = deriveInterfaceSpec(scene.rendered);
  const governanceResult = scene.id === "governance" ? result : null;

  useEffect(() => {
    if (scene.id === "governance") {
      let active = true;
      runPredefinedGovernanceTest().then((outcome) => { if (active) setResult(outcome); });
      return () => { active = false; };
    }
  }, [scene.id]);

  useEffect(() => {
    if (paused || finished) return;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      remaining.current -= now - last;
      last = now;
      if (remaining.current <= 0) {
        if (sceneIndex === scenes.length - 1) {
          setFinished(true);
        } else {
          remaining.current = scenes[sceneIndex + 1].duration;
          setSceneIndex(sceneIndex + 1);
        }
      }
    }, 50);
    return () => window.clearInterval(timer);
  }, [sceneIndex, paused, finished]);

  function replay() {
    remaining.current = scenes[0].duration;
    setSceneIndex(0);
    setFinished(false);
    setPaused(false);
    setResult(null);
  }

  const heroIds = spec.state === "disruption"
    ? ["trip-context", "disruption-banner"]
    : spec.state === "ready"
      ? ["trip-context", "header", "flight-detail", "hotel-detail"]
      : ["header", "flight-detail", "hotel-detail"];
  const bodySpec = { ...spec, sections: spec.sections.filter((section) => !heroIds.includes(section.id)) };

  return (
    <main className="atlas-explainer" data-scene={scene.id}>
      <header className="atlas-explainer__header">
        <div>
          <p className="atlas-explainer__eyebrow">Atlas / Adaptive travel</p>
          <h1>How context becomes an interface</h1>
        </div>
        <a href="/" className="atlas-explainer__prototype-link">Explore the prototype ↗</a>
      </header>

      <div className="atlas-explainer__stage">
        <ol className="atlas-explainer__pipeline" aria-label="Atlas interface pipeline">
          {phases.map((phase, index) => <li key={phase.id} className={scene.phase === phase.id ? "atlas-explainer__pipeline-active" : ""} aria-current={scene.phase === phase.id ? "step" : undefined}><span>{String(index + 1).padStart(2, "0")}</span>{phase.label}</li>)}
        </ol>
        {scene.id === "summary" ? (
          <section className="atlas-explainer__summary" aria-live="polite">
            <p className="atlas-explainer__eyebrow">The transformation</p>
            <h2>{scene.heading}</h2>
            <p>{scene.explanation}</p>
            <p className="atlas-explainer__summary-secondary">A changed signal reruns the same pipeline. Unsupported capabilities are stopped before rendering.</p>
          </section>
        ) : (
          <div className="atlas-explainer__composition">
            <section className="atlas-explainer__transformation" aria-label="Current transformation step" aria-live="polite">
              <p className="atlas-explainer__eyebrow">{scene.id === "governance" ? "Governance boundary" : `Step ${phases.findIndex((phase) => phase.id === scene.phase) + 1} / 6`}</p>
              <h2>{scene.heading}</h2>
              <p className="atlas-explainer__transformation-copy">{scene.explanation}</p>
              <div className="atlas-explainer__detail" key={scene.id}>
                <TransformationDetail scene={scene} spec={inputSpec} result={governanceResult} onRun={() => { runPredefinedGovernanceTest().then(setResult); }} />
              </div>
            </section>

            <section className="atlas-explainer__product" aria-label={`${spec.state} interface preview`}>
              <div className="atlas-explainer__product-heading"><span>{scene.change ? "Previous valid interface" : "Rendered Atlas interface"}</span><strong>{spec.state}</strong></div>
              <div className="atlas-explainer__product-canvas">
                <div className="atlas-explainer__product-scroll" key={spec.state}>
                  <div className="atlas-explainer__hero">
                    <DestinationHero state={spec.state} />
                    <div className="atlas-explainer__hero-content"><SpecRenderer spec={subset(spec, heroIds)} /></div>
                  </div>
                  <div className="atlas-explainer__product-body"><SpecRenderer spec={bodySpec} /></div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      <footer className="atlas-explainer__footer">
        <p className="atlas-explainer__counter">{String(sceneIndex + 1).padStart(2, "0")} / {String(scenes.length).padStart(2, "0")}</p>
        <div className="atlas-explainer__controls">
          <button type="button" onClick={replay}>Replay</button>
          <button type="button" onClick={() => setPaused((value) => !value)} disabled={finished}>{paused ? "Play" : "Pause"}</button>
        </div>
      </footer>
      <div className="atlas-explainer__progress" aria-hidden="true"><span key={scene.id} style={{ animationDuration: `${scene.duration}ms`, animationPlayState: paused ? "paused" : "running" }} /></div>
    </main>
  );
}
