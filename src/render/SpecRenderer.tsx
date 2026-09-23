import type { ReactNode } from "react";
import { componentRegistry } from "../components/registry/componentRegistry";
import type { ActionId } from "../components/registry/schemas";
import { validateInterfaceSpec } from "../spec/interfaceSpec.schema";
import type { InterfaceSpec } from "../spec/interfaceSpec.types";
import "./SpecRenderer.css";

type SpecRendererProps = {
  spec: InterfaceSpec;
  /**
   * UI callback, not spec data — invoked with a section's id when its
   * TaskCard is completed from the customer-facing UI. Passed alongside
   * (never inside) the Zod-validated section.props, and only ever wired
   * into TaskCard sections. Everything else about validation, the
   * registry lookup, and error handling is unaffected.
   */
  onTaskComplete?: (sectionId: string) => void;
  onAction?: (id: ActionId) => void;
  /**
   * Generic, domain-agnostic slot: arbitrary UI rendered INSIDE a given
   * section's own box, stacked below whatever the registered component
   * rendered — keyed by section id. Like onTaskComplete, this is UI
   * wiring App.tsx owns; it never passes through validateInterfaceSpec
   * or the component registry, and SpecRenderer has no idea what's
   * inside it or why. Nesting it inside the section's own box (rather
   * than alongside it as a separate flex-row item) is what lets
   * FlightStatusControl visually belong to the flight-detail section
   * regardless of that section's own row width.
   */
  renderAfterSection?: Partial<Record<string, ReactNode>>;
};

/**
 * Renders a spec by validating it, then looking each section's component
 * name up in the approved registry. There is no switch statement over
 * component names here on purpose: if it's not in the registry, or its
 * props don't pass that component's schema, it doesn't render as content —
 * it renders a visible error instead of silently dropping or guessing.
 */
export function SpecRenderer({ spec, onTaskComplete, onAction, renderAfterSection }: SpecRendererProps) {
  const result = validateInterfaceSpec(spec);

  if (!result.valid) {
    return (
      <div className="spec-renderer__error" role="alert">
        <p className="spec-renderer__error-title">Interface specification rejected</p>
        <ul>
          {result.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </div>
    );
  }

  const sorted = [...result.spec.sections].sort((a, b) => a.priority - b.priority);

  return (
    <div className="spec-renderer" data-state={result.spec.state} data-intent={result.spec.intent}>
      {sorted.map((section) => {
        const Component = componentRegistry[section.component];
        if (!Component) {
          return (
            <div className="spec-renderer__error" role="alert" key={section.id}>
              Unknown component "{section.component}" for section "{section.id}"
            </div>
          );
        }
        const extraProps =
          section.component === "TaskCard" && onTaskComplete
            ? { onComplete: () => onTaskComplete(section.id) }
            : section.component === "ActionGroup" && onAction
              ? { onAction }
              : {};
        const afterContent = renderAfterSection?.[section.id];
        return (
          <div
            className="spec-section"
            data-section-id={section.id}
            data-component={section.component}
            key={section.id}
          >
            <Component {...section.props} {...extraProps} />
            {afterContent && (
              <div className="spec-inline-slot" data-after-section-id={section.id}>
                {afterContent}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
