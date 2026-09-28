import { useEffect, useRef, useState } from "react";
import { deriveInterfaceSpec } from "../rules/rulesEngine";
import type { TravelContext } from "../rules/context";
import type { InterfaceSpec } from "../spec/interfaceSpec.types";
import { SpecRenderer } from "../render/SpecRenderer";
import { DestinationHero } from "../shell/DestinationHero";
import { DecisionInspector } from "../inspector/DecisionInspector";
import { SystemInspector } from "../devtools/SystemInspector";
import { GovernanceTest } from "../devtools/GovernanceTest";
import { InterpretationDebugView } from "../devtools/InterpretationDebugView";
import { runPredefinedGovernanceTest } from "../llm/governanceDemo";
import type { InterpretationResult } from "../llm/interpretContext";
import "../tokens/tokens.css";
import "../App.css";
import "./AtlasExplainer.css";

type SceneId = "planning" | "prep-complete" | "ready" | "flight-cancelled" | "disruption" | "inspector" | "governance" | "summary";
type Scene = {
  id: SceneId;
  duration: number;
  context: TravelContext;
  shownContext: TravelContext;
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

// One timeline controls every scene and its dwell time. Total: 28.4 seconds.
const scenes: Scene[] = [
  { id: "planning", duration: 4200, context: planning, shownContext: planning, heading: "Preparing for your trip", explanation: "One preparation task is still open, so Atlas keeps it in focus." },
  { id: "prep-complete", duration: 2200, context: planning, shownContext: ready, heading: "One signal changes", explanation: "Currency preparation is complete. Atlas evaluates the rules again.", change: "currency" },
  { id: "ready", duration: 4000, context: ready, shownContext: ready, heading: "Ready to go", explanation: "With all preparation complete, trip details and the next action come forward." },
  { id: "flight-cancelled", duration: 2200, context: ready, shownContext: disruption, heading: "Travel plans changed", explanation: "The flight is cancelled. Atlas evaluates the rules again.", change: "flight" },
  { id: "disruption", duration: 4100, context: disruption, shownContext: disruption, heading: "Recovery takes priority", explanation: "Preparation stays complete while recovery actions move to the front." },
  { id: "inspector", duration: 3900, context: disruption, shownContext: disruption, heading: "The decision is inspectable", explanation: "Flight cancellation triggered Disruption and changed the intent to recovery." },
  { id: "governance", duration: 4500, context: disruption, shownContext: disruption, heading: "Adaptation has boundaries", explanation: "An unsupported AirportMap request is blocked. The last valid interface stays in place." },
  { id: "summary", duration: 3300, context: disruption, shownContext: disruption, heading: "Context → Rules → Governed Interface", explanation: "Atlas adapts to changing context without giving the system unlimited freedom." },
];

function subset(spec: InterfaceSpec, ids: string[]): InterfaceSpec {
  return { ...spec, sections: spec.sections.filter((section) => ids.includes(section.id)) };
}

export function AtlasExplainer() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState<InterpretationResult | null>(null);
  const [closedScene, setClosedScene] = useState<SceneId | null>(null);
  const remaining = useRef(scenes[0].duration);
  const drawerRef = useRef<HTMLDivElement>(null);
  const scene = scenes[sceneIndex];
  const spec = deriveInterfaceSpec(scene.context);
  const showInspector = scene.id === "inspector" || scene.id === "governance";
  const inspectorOpen = showInspector && closedScene !== scene.id;
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

  useEffect(() => {
    if (!showInspector) return;
    const drawer = drawerRef.current;
    const body = drawer?.querySelector<HTMLElement>(".system-inspector-drawer__body");
    const target = drawer?.querySelector<HTMLElement>(scene.id === "governance" ? '[data-walkthrough-target="governance-result"]' : '[data-walkthrough-target="decision-trace"]');
    if (body && target) body.scrollTop = Math.max(0, target.offsetTop - body.offsetTop - 12);
  }, [scene.id, showInspector, result]);

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
          <h1>How Atlas adapts</h1>
        </div>
        <a href="/" className="atlas-explainer__prototype-link">Explore the prototype ↗</a>
      </header>

      <div className="atlas-explainer__stage">
        {scene.id === "summary" ? (
          <section className="atlas-explainer__summary" aria-live="polite">
            <p className="atlas-explainer__eyebrow">The system in one line</p>
            <h2>{scene.heading}</h2>
            <p>{scene.explanation}</p>
            <div className="atlas-explainer__summary-flow" aria-label="Travel context leads to evaluated rules, validated interface specification, approved components, and the rendered interface">
              <span>TravelContext</span><b>→</b><span>Rules</span><b>→</b><span>InterfaceSpec</span><b>→</b><span>Validation</span><b>→</b><span>Component registry</span><b>→</b><span>Interface</span>
            </div>
          </section>
        ) : (
          <div className="atlas-explainer__composition">
            <aside className="atlas-explainer__context" aria-label="Travel context">
              <p className="atlas-explainer__eyebrow">Structured context</p>
              <dl>
                <div><dt>Days until trip</dt><dd>24</dd></div>
                <div><dt>Travel notice</dt><dd>Complete</dd></div>
                <div><dt>Card readiness</dt><dd>Complete</dd></div>
                <div className={scene.change === "currency" ? "atlas-explainer__changed" : ""}><dt>Currency</dt><dd>{scene.shownContext.currencyPrepComplete ? "Complete" : "Incomplete"}</dd></div>
                <div className={scene.change === "flight" ? "atlas-explainer__changed" : ""}><dt>Flight status</dt><dd>{scene.shownContext.flightStatus === "cancelled" ? "Cancelled" : "Confirmed"}</dd></div>
              </dl>
              <div className="atlas-explainer__derived">
                <span>Derived state</span>
                <strong>{scene.change ? "Evaluating…" : spec.state.toUpperCase()}</strong>
              </div>
              {scene.change && <p className="atlas-explainer__causal">Context changed <span>→</span> rules re-evaluated</p>}
              {(scene.id === "inspector" || scene.id === "governance") && <p className="atlas-explainer__path">TravelContext → rules → InterfaceSpec → validation → component registry → interface</p>}
            </aside>

            <section className="atlas-explainer__product" aria-label={`${spec.state} interface preview`}>
              <div className="atlas-explainer__product-heading"><span>Atlas prototype</span><span>{spec.state}</span></div>
              <div className="atlas-explainer__product-canvas" ref={drawerRef}>
                <div className="atlas-explainer__product-scroll" key={spec.state}>
                  <div className="atlas-explainer__hero">
                    <DestinationHero state={spec.state} />
                    <div className="atlas-explainer__hero-content"><SpecRenderer spec={subset(spec, heroIds)} /></div>
                  </div>
                  <div className="atlas-explainer__product-body"><SpecRenderer spec={bodySpec} /></div>
                </div>
                <SystemInspector
                  isOpen={inspectorOpen}
                  onOpenChange={(open) => setClosedScene(open ? null : scene.id)}
                  contextControls={<dl className="atlas-explainer__inspector-context"><div><dt>Flight status</dt><dd>{scene.context.flightStatus}</dd></div><div><dt>Preparation</dt><dd>3 of 3 complete</dd></div></dl>}
                  decisionTrace={<DecisionInspector spec={spec} />}
                  naturalLanguageInput={null}
                  interpretationDebug={<InterpretationDebugView result={governanceResult} />}
                  governanceTest={<GovernanceTest onRun={() => { runPredefinedGovernanceTest().then(setResult); }} result={governanceResult} />}
                />
              </div>
            </section>
          </div>
        )}
      </div>

      <footer className="atlas-explainer__footer">
        <div className="atlas-explainer__narration" aria-live="polite" key={scene.id}>
          <span className="atlas-explainer__eyebrow">{String(sceneIndex + 1).padStart(2, "0")} / {String(scenes.length).padStart(2, "0")}</span>
          {scene.id !== "summary" && <><h2>{scene.heading}</h2><p>{scene.explanation}</p></>}
        </div>
        <div className="atlas-explainer__controls">
          <button type="button" onClick={replay}>Replay</button>
          <button type="button" onClick={() => setPaused((value) => !value)} disabled={finished}>{paused ? "Play" : "Pause"}</button>
        </div>
      </footer>
      <div className="atlas-explainer__progress" aria-hidden="true"><span key={scene.id} style={{ animationDuration: `${scene.duration}ms`, animationPlayState: paused ? "paused" : "running" }} /></div>
    </main>
  );
}
