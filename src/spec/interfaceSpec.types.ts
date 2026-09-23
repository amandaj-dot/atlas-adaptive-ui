import type { z } from "zod";
import type { componentSchemas, ComponentName } from "../components/registry/schemas";
import type { IntentTag } from "../tokens/tokens";

/**
 * A typed section for a specific component — used by rule modules so
 * authoring a section gets autocomplete + type-checking on `props`
 * instead of an untyped record. Structurally compatible with what
 * interfaceSpecShape (Zod) expects; Zod is still the runtime source of
 * truth, this is just the compile-time convenience layer over it.
 */
export type Section<C extends ComponentName = ComponentName> = {
  id: string;
  component: C;
  props: z.infer<(typeof componentSchemas)[C]>;
  priority: number;
};

export type TraceEntry = {
  rule: string;
  reason: string;
};

export type InterfaceState = "planning" | "disruption" | "ready";

export type InterfaceSpec = {
  state: InterfaceState;
  intent: IntentTag;
  sections: Section[];
  trace: TraceEntry[];
};
