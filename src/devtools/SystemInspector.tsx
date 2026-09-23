import type { ReactNode } from "react";
import "./SystemInspector.css";

// Keep the interpretation tool wired for future development without
// displaying it in the focused prototype.
const showNaturalLanguageTools = false;

type SystemInspectorProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /**
   * Each existing tool, passed in unchanged by App.tsx — SystemInspector
   * never recreates or duplicates them. Named slots (rather than one
   * opaque children blob) so each can get its own labeled section in the
   * drawer's information hierarchy, per the requested organization.
   */
  contextControls: ReactNode;
  decisionTrace: ReactNode;
  naturalLanguageInput: ReactNode;
  interpretationDebug: ReactNode;
  governanceTest: ReactNode;
};

/**
 * Fixed, collapsible right-side drawer — overlays the customer
 * experience rather than resizing/reflowing it. Collapsed by default.
 *
 * isOpen is purely local presentation state: it controls only whether
 * this drawer is visible. It never touches TravelContext, TripData,
 * InterfaceSpec, or the rules engine — closing/opening the inspector
 * has zero effect on the adaptive product underneath it.
 *
 * The drawer stays mounted at all times and slides via a CSS
 * transform, rather than conditionally mounting/unmounting — simpler
 * keyboard/focus behavior than a mount-on-open pattern, and avoids
 * needing a dedicated focus-trap implementation for a prototype.
 */
export function SystemInspector({
  isOpen,
  onOpenChange,
  contextControls,
  decisionTrace,
  naturalLanguageInput,
  interpretationDebug,
  governanceTest,
}: SystemInspectorProps) {
  return (
    <>
      {!isOpen && (
        <button
          type="button"
          className="system-inspector-trigger"
          onClick={() => onOpenChange(true)}
          aria-expanded={false}
          aria-controls="system-inspector-drawer"
        >
          <span aria-hidden="true">‹</span> SYSTEM
        </button>
      )}

      <aside
        id="system-inspector-drawer"
        className={`system-inspector-drawer${isOpen ? " system-inspector-drawer--open" : ""}`}
        aria-hidden={!isOpen}
      >
        <div className="system-inspector-drawer__header">
          <p className="system-inspector-drawer__title">System Inspector</p>
          <button
            type="button"
            className="system-inspector-drawer__close"
            onClick={() => onOpenChange(false)}
            aria-label="Close system inspector"
            tabIndex={isOpen ? 0 : -1}
          >
            ×
          </button>
        </div>

        <p className="system-inspector-drawer__help">Inspect how Atlas interpreted the current context, which rules were triggered, and why the interface changed.</p>

        <div className="system-inspector-drawer__body">
          <section className="system-inspector-section">
            <p className="system-inspector-section__label">Context</p>
            {contextControls}
          </section>

          <section className="system-inspector-section">
            <p className="system-inspector-section__label" data-walkthrough-target="decision-trace">State &amp; decision trace</p>
            {decisionTrace}
          </section>

          {showNaturalLanguageTools && (
            <section className="system-inspector-section">
              <p className="system-inspector-section__label">Natural-language context</p>
              {naturalLanguageInput}
            </section>
          )}

          <section className="system-inspector-section" data-walkthrough-target="governance-result">
            <p className="system-inspector-section__label">Governance</p>
            {governanceTest}
            {interpretationDebug}
          </section>
        </div>
      </aside>
    </>
  );
}
