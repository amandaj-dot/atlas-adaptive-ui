# Atlas — Adaptive Travel Experience

[Live prototype](https://atlas-ecru-one.vercel.app/)

Atlas is a rules-driven adaptive UI prototype for a travel scenario. Completing three preparation tasks moves the experience from Planning to Ready. Setting the flight status to Cancelled moves it to Disruption and brings recovery actions forward. The flight selector simulates a context change; it does not connect to an airline feed.

## How it works

```text
TravelContext → deterministic rules → InterfaceSpec → Zod validation
              → approved component registry → React interface
```

`TravelContext` holds trip timing, flight status, and preparation progress. The rules engine chooses Planning, Ready, or Disruption and records its decisions in a trace. The interface specification is validated before its sections are rendered through the approved component registry. The System Inspector displays the current context and rule trace.

The five-step walkthrough guides visitors through preparation, readiness, disruption, system transparency, and governance. Its completion is remembered for the current browser session. Visitors can skip or replay it.

## Governance demo

The predefined governance test requests an `AirportMap` component. Because `AirportMap` is absent from the approved registry, the request is blocked and the last valid interface stays in place. The Inspector shows the requested capability and validation result.

This is a focused demonstration of one unsupported request. The public prototype does not use a live LLM to generate screens. The repository retains an optional natural-language interpretation path for development, but its controls are hidden from the public UI. No Anthropic API key is needed to run the visible demo.

## Run locally

Requires Node.js and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. `npm run build` type-checks and builds the production bundle; `npm run lint` runs Oxlint.

## Key files

| File | Role |
| --- | --- |
| `src/rules/context.ts` | Travel context type and Zod schema |
| `src/rules/rulesEngine.ts` | State precedence and interface-spec derivation |
| `src/rules/rules/` | State-specific sections and decision traces |
| `src/spec/interfaceSpec.schema.ts` | Interface-spec validation |
| `src/components/registry/` | Approved components and prop schemas |
| `src/render/SpecRenderer.tsx` | Validates and renders registered components |
| `src/devtools/SystemInspector.tsx` | Context, decisions, and governance result |
| `src/shell/Walkthrough.tsx` | Guided, skippable demonstration |

The initial prototype was built with Claude Free and later refined, tested, and deployed with Codex. These were development tools; the public interaction is driven by the application's rules and components.
