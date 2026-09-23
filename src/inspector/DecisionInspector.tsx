import type { InterfaceSpec } from "../spec/interfaceSpec.types";
import "./DecisionInspector.css";

type DecisionInspectorProps = {
  spec: InterfaceSpec;
};

/**
 * Plain, functional rendering of the rules engine's trace — kept simple
 * on purpose for this milestone. The point being demonstrated is that
 * every interface decision is explainable, not that the panel is polished.
 */
export function DecisionInspector({ spec }: DecisionInspectorProps) {
  return (
    <aside className="decision-inspector">
      <p className="decision-inspector__heading">Decision inspector</p>
      <dl className="decision-inspector__meta">
        <div>
          <dt>state</dt>
          <dd>{spec.state}</dd>
        </div>
        <div>
          <dt>intent</dt>
          <dd>{spec.intent}</dd>
        </div>
      </dl>
      <ol className="decision-inspector__trace">
        {spec.trace.map((entry, index) => (
          <li key={`${entry.rule}-${index}`}>
            <span className="decision-inspector__rule">{entry.rule}</span>
            <span className="decision-inspector__reason">{entry.reason}</span>
          </li>
        ))}
      </ol>
    </aside>
  );
}
