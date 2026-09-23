import type { LLMProvider } from "./interpretContext";
import type { InterpretedOutput } from "./mockInterpretation";

/**
 * Calls /api/interpret-context, served by Vite middleware locally and a
 * Vercel Function in production. The Anthropic API key stays server-side.
 * This
 * satisfies the exact same LLMProvider signature mockInterpretUserInput
 * does — interpretContext.ts's validation and governance-check logic
 * downstream is completely unaware of which one produced the output.
 *
 * In production App.tsx selects this provider when the Vercel Function
 * reports that a key is configured.
 */
export const realAnthropicProvider: LLMProvider = async (input) => {
  const response = await fetch("/api/interpret-context", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ input }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`interpret-context request failed (${response.status}): ${body}`);
  }

  return (await response.json()) as InterpretedOutput;
};
