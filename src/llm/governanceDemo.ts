import { interpretContext } from "./interpretContext";

export const GOVERNANCE_REQUEST = "Show me an interactive map of nearby airports with alternative flight options.";

// The public demo and the explainer use the same predefined unsupported request.
export function runPredefinedGovernanceTest() {
  return interpretContext(GOVERNANCE_REQUEST, async () => ({
    kind: "capability_request",
    capability: "AirportMap",
  }));
}
