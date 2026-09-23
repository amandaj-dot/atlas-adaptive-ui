import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * Server-side handler shared by the Vite dev server and the Vercel Function.
 * The API key stays on the server and is never bundled into client JS.
 *
 * Output contract: returns exactly the same shape mockInterpretUserInput
 * returns (src/llm/mockInterpretation.ts's InterpretedOutput) — either
 * { kind: "context", data: {...} } or { kind: "capability_request",
 * capability: "..." }. interpretContext.ts's governance check
 * (componentSchemas lookup) doesn't know or care which provider produced
 * this — real or mock, the boundary is identical.
 */

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

const TOOL_SCHEMA = {
  name: "return_interpretation",
  description: "Return the interpreted result of the user's natural-language travel input.",
  input_schema: {
    type: "object",
    properties: {
      kind: {
        type: "string",
        enum: ["context", "capability_request"],
        description:
          "'context' if the input updates known travel context fields; 'capability_request' if it asks for a UI feature/capability that is not one of those fields.",
      },
      data: {
        type: "object",
        description: "Only present when kind is 'context'.",
        properties: {
          daysUntilTrip: { type: "number", description: "Default to 24 if not mentioned." },
          flightStatus: { type: "string", enum: ["confirmed", "cancelled", "delayed"] },
          travelNoticeComplete: { type: "boolean" },
          cardReadinessComplete: { type: "boolean" },
          currencyPrepComplete: { type: "boolean" },
        },
      },
      capability: {
        type: "string",
        description:
          "Only present when kind is 'capability_request'. A short PascalCase name for the requested capability, e.g. 'AirportMap'.",
      },
    },
    required: ["kind"],
  },
} as const;

const SYSTEM_PROMPT = `You interpret natural-language input for a travel app's adaptive interface.
Decide whether the input:
(a) updates known travel context fields — daysUntilTrip, flightStatus (confirmed/cancelled/delayed), travelNoticeComplete, cardReadinessComplete, currencyPrepComplete — or
(b) requests a new interface capability that is not one of those fields (for example, showing a map, a chart, a chatbot, or any other UI feature).
Call return_interpretation exactly once.
For (a): set kind="context" and fill "data" with all five fields — default daysUntilTrip to 24 and any unmentioned boolean to false unless the input clearly implies otherwise.
For (b): set kind="capability_request" and fill "capability" with a short PascalCase name (e.g. "AirportMap"). Do not include "data" in this case.`;

export async function handleInterpretContext(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID;
  if (!apiKey) {
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "ANTHROPIC_API_KEY is not set. Add it to .env.local." }));
    return;
  }

  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 2048) {
      res.statusCode = 413;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ error: "Request too large" }));
      return;
    }
  }

  let input: string;
  try {
    const parsed = JSON.parse(body);
    input = parsed.input;
    if (typeof input !== "string" || input.trim().length === 0 || input.length > 500) {
      throw new Error("missing input");
    }
  } catch {
    res.statusCode = 400;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "Request body must be JSON: { input: string }" }));
    return;
  }

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        ...(workspaceId ? { "anthropic-workspace-id": workspaceId } : {}),
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: input }],
        tools: [TOOL_SCHEMA],
        tool_choice: { type: "tool", name: "return_interpretation" },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      res.statusCode = response.status;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ error: `Anthropic API error (${response.status}): ${text}` }));
      return;
    }

    const json = (await response.json()) as {
      content?: Array<{ type: string; input?: unknown }>;
    };
    const toolUse = json.content?.find((block) => block.type === "tool_use");
    if (!toolUse) {
      res.statusCode = 502;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ error: "Model response had no tool_use block." }));
      return;
    }

    res.statusCode = 200;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify(toolUse.input));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: String(err) }));
  }
}
