import { useEffect, useRef, useState } from "react";
import { initialContext, type TravelContext } from "./rules/context";
import { PREP_TASK_FIELD } from "./rules/taskFieldMap";
import { deriveInterfaceSpec } from "./rules/rulesEngine";
import { SpecRenderer } from "./render/SpecRenderer";
import { DecisionInspector } from "./inspector/DecisionInspector";
import { ContextControlPanel } from "./devtools/ContextControlPanel";
import { FlightStatusControl } from "./devtools/FlightStatusControl";
import { NaturalLanguageInput } from "./devtools/NaturalLanguageInput";
import { InterpretationDebugView } from "./devtools/InterpretationDebugView";
import { SystemInspector } from "./devtools/SystemInspector";
import { GovernanceTest } from "./devtools/GovernanceTest";
import { interpretContext, type InterpretationResult } from "./llm/interpretContext";
import { runPredefinedGovernanceTest } from "./llm/governanceDemo";
import { realAnthropicProvider } from "./llm/realAnthropicProvider";
import { DestinationHero } from "./shell/DestinationHero";
import { DemoActionPanel } from "./shell/DemoActionPanel";
import { Walkthrough } from "./shell/Walkthrough";
import type { ActionId } from "./components/registry/schemas";
import "./tokens/tokens.css";
import "./App.css";

const contextNames: Record<keyof TravelContext, string> = {
  daysUntilTrip: "Trip timing",
  flightStatus: "Flight status",
  travelNoticeComplete: "Travel notice",
  cardReadinessComplete: "Card readiness",
  currencyPrepComplete: "Currency preparation",
};
const stateNames = { planning: "Planning", ready: "Ready", disruption: "Disruption" } as const;

function App() {
  const [context, setContext] = useState<TravelContext>(initialContext);
  const [interpretation, setInterpretation] = useState<InterpretationResult | null>(null);
  const [isInterpreting, setIsInterpreting] = useState(false);
  // DEV-ONLY: switches the natural-language path between the mock
  // interpreter and a real Anthropic call (server/interpretContextHandler.ts,
  // reachable only while `npm run dev` is running). Governance behavior
  // downstream — validateTravelContext, the componentSchemas capability
  // check — is identical either way; this only changes where the
  // InterpretedOutput comes from.
  const [useRealLLM, setUseRealLLM] = useState(false);
  const [liveLLMAvailable, setLiveLLMAvailable] = useState(false);
  const [activeAction, setActiveAction] = useState<ActionId | null>(null);
  const [contextFeedback, setContextFeedback] = useState<string | null>(null);
  const previousContext = useRef(context);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [introExpanded, setIntroExpanded] = useState(true);
  const [walkthroughStep, setWalkthroughStep] = useState<number | null>(() => {
    try {
      return sessionStorage.getItem("atlas-walkthrough-complete-v1") === "true" ? null : 0;
    } catch {
      return 0;
    }
  });

  function finishWalkthrough() {
    try { sessionStorage.setItem("atlas-walkthrough-complete-v1", "true"); } catch { /* Storage may be unavailable. */ }
    setWalkthroughStep(null);
  }

  function navigateWalkthrough(step: number) {
    if (step === 0) {
      setContext(initialContext);
      setInspectorOpen(false);
      setActiveAction(null);
    } else if (step === 1) {
      setContext((prev) => ({ ...prev, flightStatus: "confirmed" }));
      setInspectorOpen(false);
    } else if (step === 2) {
      setInspectorOpen(false);
    } else if (step === 4) {
      setInspectorOpen(true);
    }
    setWalkthroughStep(step);
  }

  function replayWalkthrough() {
    setContext(initialContext);
    setInterpretation(null);
    setInspectorOpen(false);
    setActiveAction(null);
    setWalkthroughStep(0);
  }

  useEffect(() => {
    if (import.meta.env.DEV) return;
    fetch("/api/interpret-context")
      .then((response) => response.ok ? response.json() : null)
      .then((status) => setLiveLLMAvailable(status?.enabled === true))
      .catch(() => setLiveLLMAvailable(false));
  }, []);

  // CONTEXT -> RULES -> INTERFACE SPEC. Validation + rendering happen
  // inside SpecRenderer, right before anything reaches the screen.
  const spec = deriveInterfaceSpec(context);

  useEffect(() => {
    const previous = previousContext.current;
    previousContext.current = context;
    const changed = (Object.keys(contextNames) as (keyof TravelContext)[])
      .filter((key) => previous[key] !== context[key]);
    if (!changed.length) return;
    const before = deriveInterfaceSpec(previous).state;
    const after = deriveInterfaceSpec(context).state;
    const input = changed.map((key) => contextNames[key]).join(", ");
    setContextFeedback(`${input} changed → rules evaluated → ${before === after
      ? `interface remains in ${stateNames[after]}`
      : `interface moved from ${stateNames[before]} to ${stateNames[after]}`}`);
    const timer = window.setTimeout(() => setContextFeedback(null), 6500);
    return () => window.clearTimeout(timer);
  }, [context]);

  // Natural-language path: interpret -> governed boundary check ->
  // only update context when the result is a validated context update.
  // A rejected capability request (or an invalid context) never calls
  // setContext, so the last valid rendered interface is preserved with
  // no special-case "rollback" needed — it simply never changed.
  async function handleInterpret(input: string) {
    setIsInterpreting(true);
    try {
      const provider = (import.meta.env.DEV ? useRealLLM : liveLLMAvailable)
        ? realAnthropicProvider
        : undefined;
      const result = await interpretContext(input, provider);
      setInterpretation(result);
      if (result.kind === "context" && result.valid) {
        setContext(result.context);
      }
    } catch (err) {
      // Provider-level failure (missing/invalid key, network issue,
      // rate limit) — surfaced through the same debug UI as an invalid
      // context result, rather than a new UI just for this dev path.
      setInterpretation({
        kind: "context",
        valid: false,
        rawInput: input,
        rawOutput: null,
        errors: [`Provider request failed: ${err instanceof Error ? err.message : String(err)}`],
      });
    } finally {
      setIsInterpreting(false);
    }
  }

  async function runGovernanceTest() {
    // The predefined candidate uses the same registry check as any interpreted request.
    const result = await runPredefinedGovernanceTest();
    setInterpretation(result);
  }

  // Customer-facing completion path: TaskCard -> this handler -> the SAME
  // context state ContextControlPanel writes to. PREP_TASK_FIELD is the
  // one place that knows which context field a given task id represents;
  // this function doesn't duplicate that association.
  function handleTaskComplete(sectionId: string) {
    const field = PREP_TASK_FIELD[sectionId];
    if (!field) return;
    setActiveAction(null);
    const nextContext = { ...context, [field]: true };
    setContext(nextContext);
    if (walkthroughStep === 0 && nextContext.travelNoticeComplete &&
        nextContext.cardReadinessComplete && nextContext.currencyPrepComplete) {
      setWalkthroughStep(1);
    }
  }

  // The SAME FlightStatusControl, SAME setter as ContextControlPanel —
  // rendered nested inside the flight-detail section's own box (see
  // SpecRenderer.tsx) in every state that has one: Planning, Ready, and
  // Disruption. Unconditional now that it's a docile "part of that
  // section's own content" rather than a separate row item — no
  // per-state branching needed.
  const renderAfterSection = {
    "flight-detail": (
      <FlightStatusControl
        value={context.flightStatus}
        onChange={(flightStatus) => {
          setActiveAction(null);
          setContext((prev) => ({ ...prev, flightStatus }));
        }}
        label="Simulate flight status"
        className="flight-status-inline"
      />
    ),
    "recovery-actions": activeAction && activeAction !== "view-journey" ? (
      <DemoActionPanel action={activeAction} onClose={() => setActiveAction(null)} />
    ) : null,
    "primary-action": activeAction === "view-journey" ? (
      <DemoActionPanel action={activeAction} onClose={() => setActiveAction(null)} />
    ) : null,
  };

  return (
    <div className="app" data-state={spec.state}>
      <header className="shell">
        <p className="shell__label">Atlas — Adaptive Travel Experience Prototype</p>
        {walkthroughStep === null && (
          <button type="button" className="shell__replay" onClick={replayWalkthrough}>
            Replay walkthrough
          </button>
        )}
      </header>

      <section className="logic-intro" aria-labelledby="logic-intro-title">
        <div className="logic-intro__header">
          <h2 id="logic-intro-title">Atlas adapts the interface based on changing travel context.</h2>
          <button
            type="button"
            className="logic-intro__toggle"
            aria-expanded={introExpanded}
            aria-controls="logic-intro-content"
            onClick={() => setIntroExpanded((expanded) => !expanded)}
          >
            {introExpanded ? "Hide explanation" : "Show explanation"}
          </button>
        </div>
        <div id="logic-intro-content" className="logic-intro__content" hidden={!introExpanded}>
          <div className="logic-intro__copy">
            <p>Signals such as trip readiness, task completion, and flight status are evaluated against a set of rules. Those decisions determine which interface state is shown — Planning, Ready, or Disruption.</p>
          </div>
          <div className="logic-intro__model" aria-label="Context leads to rules, which determine the interface">
            <div className="logic-intro__stage">
              <h3>Context</h3>
              <p>Trip status, completed prep tasks, flight state</p>
            </div>
            <div className="logic-intro__stage">
              <h3>Rules</h3>
              <p>Evaluate what matters now and what the traveler needs next</p>
            </div>
            <div className="logic-intro__stage">
              <h3>Interface</h3>
              <p>Show the appropriate state, actions, and guidance</p>
            </div>
          </div>
        </div>
      </section>

      {/*
        hero-stack: canvas (DestinationHero, purely decorative) and
        content (SpecRenderer, registry-rendered) share the same grid
        cell in planning/ready, so the first sections visually sit ON
        the canvas without any duplicated content or negative-margin
        guesswork — see App.css. In disruption, the stack switches to
        normal block flow: a short, subdued canvas followed by content,
        no overlap, since recovery content should dominate rather than
        share a composition with destination imagery.
      */}
      <div className="hero-stack" data-state={spec.state}>
        <div className="hero-stack__canvas">
          <DestinationHero state={spec.state} />
        </div>
        <div className="hero-stack__content">
          <SpecRenderer
            spec={spec}
            onTaskComplete={handleTaskComplete}
            onAction={setActiveAction}
            renderAfterSection={renderAfterSection}
          />
        </div>
      </div>

      {contextFeedback && (
        <p className="context-feedback" role="status">
          <span>Context input</span> {contextFeedback}
        </p>
      )}

      <SystemInspector
        isOpen={inspectorOpen}
        onOpenChange={setInspectorOpen}
        contextControls={<ContextControlPanel context={context} onChange={(nextContext) => {
          setActiveAction(null);
          setContext(nextContext);
        }} />}
        decisionTrace={<DecisionInspector spec={spec} />}
        naturalLanguageInput={
          <>
            {import.meta.env.DEV && (
              <label className="nl-provider-toggle">
                <input
                  type="checkbox"
                  checked={useRealLLM}
                  onChange={(e) => setUseRealLLM(e.target.checked)}
                />
                Use real Claude API (dev only, requires local .env.local)
              </label>
            )}
            <NaturalLanguageInput
              onInterpret={handleInterpret}
              isLoading={isInterpreting}
              isLive={import.meta.env.DEV ? useRealLLM : liveLLMAvailable}
            />
          </>
        }
        interpretationDebug={<InterpretationDebugView result={interpretation} />}
        governanceTest={<GovernanceTest onRun={runGovernanceTest} result={interpretation} />}
      />
      {walkthroughStep !== null && (
        <Walkthrough
          step={walkthroughStep}
          state={spec.state}
          inspectorOpen={inspectorOpen}
          governanceBlocked={interpretation?.kind === "capability_request" && !interpretation.approved}
          onStepChange={navigateWalkthrough}
          onComplete={finishWalkthrough}
        />
      )}
    </div>
  );
}

export default App;
