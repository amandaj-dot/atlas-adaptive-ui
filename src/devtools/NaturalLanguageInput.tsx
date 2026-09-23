import { useState } from "react";
import "./NaturalLanguageInput.css";

type NaturalLanguageInputProps = {
  onInterpret: (input: string) => void;
  isLoading: boolean;
  isLive: boolean;
};

/**
 * Sits alongside ContextControlPanel, not in place of it — this is the
 * "how it could work with AI" path, and ContextControlPanel remains the
 * "how it works deterministically, by hand" path. Both write to the same
 * TravelContext state in App.tsx; neither bypasses validation.
 */
export function NaturalLanguageInput({ onInterpret, isLoading, isLive }: NaturalLanguageInputProps) {
  const [text, setText] = useState("");

  return (
    <div className="nl-input">
      <p className="nl-input__heading">Natural-language context ({isLive ? "Claude" : "mock interpreter"})</p>
      <p className="nl-input__note">
        {isLive
          ? "Claude interprets your text; the resulting context is validated before the interface changes."
          : "This uses a small keyword-based mock so the validation boundary can be demonstrated end to end."}
      </p>
      <textarea
        className="nl-input__textarea"
        placeholder='e.g. "My flight was cancelled and I still need to prepare for my trip."'
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={500}
      />
      <button
        className="nl-input__button"
        type="button"
        disabled={isLoading || text.trim().length === 0}
        onClick={() => onInterpret(text)}
      >
        {isLoading ? "Interpreting…" : "Interpret context"}
      </button>
    </div>
  );
}
