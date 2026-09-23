const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

const TOOL_SCHEMA = {
  name: "return_interpretation",
  description: "Return the interpreted result of the user's natural-language travel input.",
  input_schema: {
    type: "object",
    properties: {
      kind: { type: "string", enum: ["context", "capability_request"] },
      data: {
        type: "object",
        properties: {
          daysUntilTrip: { type: "number" },
          flightStatus: { type: "string", enum: ["confirmed", "cancelled", "delayed"] },
          travelNoticeComplete: { type: "boolean" },
          cardReadinessComplete: { type: "boolean" },
          currencyPrepComplete: { type: "boolean" },
        },
      },
      capability: { type: "string" },
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

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "cache-control": "no-store" } });

export function GET() {
  return json({ enabled: Boolean(process.env.ANTHROPIC_API_KEY) });
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json({ error: "Claude is not configured" }, 503);
  if (Number(request.headers.get("content-length")) > 2048) {
    return json({ error: "Request too large" }, 413);
  }

  let input: string;
  try {
    const body = await request.text();
    if (body.length > 2048) return json({ error: "Request too large" }, 413);
    input = JSON.parse(body).input;
    if (typeof input !== "string" || !input.trim() || input.length > 500) {
      return json({ error: "Input must be 1–500 characters" }, 400);
    }
  } catch {
    return json({ error: "Request body must be JSON: { input: string }" }, 400);
  }

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      signal: AbortSignal.timeout(15000),
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        ...(process.env.ANTHROPIC_WORKSPACE_ID
          ? { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID }
          : {}),
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
      console.error("Claude API request failed", response.status);
      return json({ error: "Claude is temporarily unavailable" }, 502);
    }

    const result = (await response.json()) as {
      content?: Array<{ type: string; input?: unknown }>;
    };
    const toolUse = result.content?.find((block) => block.type === "tool_use");
    if (!toolUse) return json({ error: "Claude returned no interpretation" }, 502);
    return json(toolUse.input);
  } catch (error) {
    console.error("Claude API request failed", error);
    return json({ error: "Claude is temporarily unavailable" }, 502);
  }
}
