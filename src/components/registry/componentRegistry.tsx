import { Banner } from "../primitives/Banner";
import { SectionHeader } from "../primitives/SectionHeader";
import { TaskCard } from "../primitives/TaskCard";
import { ActionGroup } from "../primitives/ActionGroup";
import { StatusList } from "../primitives/StatusList";
import { DetailCard } from "../primitives/DetailCard";
import { componentSchemas, type ComponentName } from "./schemas";

/**
 * The approved component registry. This is the ONLY set of components the
 * renderer is allowed to render. A section in an interface specification
 * whose `component` field isn't a key here — or whose props don't satisfy
 * the matching schema in schemas.ts — will not render as content; it will
 * fall through to a visible error state instead of failing silently.
 *
 * Registering a component means adding it in exactly two places:
 * schemas.ts (its prop contract) and here (its implementation). Adding a
 * component to only one of the two is a broken registration on purpose —
 * it forces contract and implementation to be updated together.
 */
export const componentRegistry: Record<ComponentName, React.ComponentType<any>> = {
  Banner,
  SectionHeader,
  TaskCard,
  ActionGroup,
  StatusList,
  DetailCard,
};

export { componentSchemas };
export type { ComponentName };
