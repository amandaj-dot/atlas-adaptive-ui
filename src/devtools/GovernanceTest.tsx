import type { InterpretationResult } from "../llm/interpretContext";
import "./GovernanceTest.css";

type GovernanceTestProps = {
  onRun: () => void;
  result: InterpretationResult | null;
};

export function GovernanceTest({ onRun, result }: GovernanceTestProps) {
  const blocked = result?.kind === "capability_request" && !result.approved;

  return (
    <div className="governance-test">
      <p className="governance-test__label">Predefined governance test</p>
      <p className="governance-test__description">Request an interactive airport map, a component outside Atlas’s approved registry.</p>
      <button type="button" onClick={onRun}>Try unsupported request</button>
      {blocked && (
        <p className="governance-test__response" role="status">
          Blocked: {result.capability} is not in the approved component registry. The current interface remains in place.
        </p>
      )}
    </div>
  );
}
