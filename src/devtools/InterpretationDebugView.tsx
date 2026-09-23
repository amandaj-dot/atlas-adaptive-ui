import type { InterpretationResult } from "../llm/interpretContext";
import "./InterpretationDebugView.css";

type InterpretationDebugViewProps = {
  result: InterpretationResult | null;
};

/**
 * Deliberately plain — this is about proving the data flow (raw input →
 * raw output → outcome) is real and inspectable, not about how it looks.
 * Two governed outcomes now render here, using the same block/label/
 * status convention: a context update (validated against
 * travelContextSchema) or a requested interface capability (checked
 * against componentRegistry). Neither gets a bespoke error design.
 */
export function InterpretationDebugView({ result }: InterpretationDebugViewProps) {
  if (!result) {
    return null;
  }

  if (result.kind === "capability_request") {
    return (
      <div className="interpretation-debug">
        <p className="interpretation-debug__heading">Governance result</p>

        <p className="interpretation-debug__label">Requested capability</p>
        <pre className="interpretation-debug__block">{result.capability}</pre>

        <p className="interpretation-debug__label">Validation status</p>
        {result.approved ? (
          <p className="interpretation-debug__status interpretation-debug__status--valid">
            approved — {result.capability} is in the component registry
          </p>
        ) : (
          <>
            <p className="interpretation-debug__status interpretation-debug__status--invalid">
              blocked — unsupported capability
            </p>
            <ul className="interpretation-debug__errors">
              <li>{result.capability} is not in the approved component registry.</li>
              <li>Last valid interface preserved.</li>
            </ul>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="interpretation-debug">
      <p className="interpretation-debug__heading">Interpretation debug</p>

      <p className="interpretation-debug__label">Raw input</p>
      <pre className="interpretation-debug__block">{result.rawInput}</pre>

      <p className="interpretation-debug__label">Raw output (pre-validation)</p>
      <pre className="interpretation-debug__block">{JSON.stringify(result.rawOutput, null, 2)}</pre>

      <p className="interpretation-debug__label">Validation status</p>
      {result.valid ? (
        <p className="interpretation-debug__status interpretation-debug__status--valid">
          valid — context applied
        </p>
      ) : (
        <>
          <p className="interpretation-debug__status interpretation-debug__status--invalid">
            invalid — context NOT applied
          </p>
          <ul className="interpretation-debug__errors">
            {result.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
