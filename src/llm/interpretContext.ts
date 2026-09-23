import { validateTravelContext, type TravelContext } from "../rules/context";
import { mockInterpretUserInput, type InterpretedOutput } from "./mockInterpretation";
import { componentSchemas } from "../components/registry/schemas";

/**
 * The only contract an interpretation provider has to satisfy: take
 * natural-language text, return an InterpretedOutput (untyped payload
 * inside it — same as real LLM output, it is not trusted until
 * validated/checked below). Swapping providers means swapping this
 * function; nothing else in the app changes.
 *
 * The real provider calls a server-side endpoint. A provider API key
 * must never be placed in client-side code.
 */
export type LLMProvider = (input: string) => Promise<InterpretedOutput>;

/**
 * This default provider wraps the mock interpreter from
 * mockInterpretation.ts in a Promise so the calling code below already
 * has the same async shape as the Claude provider. The validation and
 * registry governance checks below apply to both providers.
 */
const mockProvider: LLMProvider = async (input) => mockInterpretUserInput(input);

export type InterpretationResult =
  | { kind: "context"; valid: true; rawInput: string; rawOutput: unknown; context: TravelContext }
  | { kind: "context"; valid: false; rawInput: string; rawOutput: unknown; errors: string[] }
  | { kind: "capability_request"; rawInput: string; capability: string; approved: boolean };

/**
 * The single entry point the UI calls. Runs the provider, then always
 * checks the result against one of two governed boundaries before it's
 * usable:
 *
 * - "context" output → validated against travelContextSchema (unchanged
 *   from before this milestone).
 * - "capability_request" output → checked against componentSchemas —
 *   the canonical set of approved component names (the same set
 *   componentRegistry.tsx maps to implementations, and the same set
 *   interfaceSpecShape derives its component enum from). A capability
 *   is either already a key there or it is rejected outright — there is
 *   no path where interpretation adds one dynamically. TravelContext is
 *   never touched for this outcome (see App.tsx: setContext is only
 *   called for `kind: "context", valid: true`), so the last valid
 *   rendered interface is preserved automatically, not through
 *   special-case "rollback" logic.
 */
export async function interpretContext(
  input: string,
  provider: LLMProvider = mockProvider
): Promise<InterpretationResult> {
  const output = await provider(input);

  if (output.kind === "capability_request") {
    const approved = output.capability in componentSchemas;
    return {
      kind: "capability_request",
      rawInput: input,
      capability: output.capability,
      approved,
    };
  }

  const validation = validateTravelContext(output.data);
  if (validation.valid) {
    return { kind: "context", valid: true, rawInput: input, rawOutput: output.data, context: validation.context };
  }
  return { kind: "context", valid: false, rawInput: input, rawOutput: output.data, errors: validation.errors };
}
