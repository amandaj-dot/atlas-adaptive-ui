import type { z } from "zod";
import type { ActionId, actionGroupSchema } from "../registry/schemas";
import "./ActionGroup.css";

type ActionGroupProps = z.infer<typeof actionGroupSchema> & {
  onAction?: (id: ActionId) => void;
};

export function ActionGroup({ actions, onAction }: ActionGroupProps) {
  return (
    <div className="action-group">
      {actions.map((action) => (
        <button
          key={action.id}
          className={`action-group__button action-group__button--${action.emphasis}`}
          type="button"
          onClick={() => onAction?.(action.id)}
        >
          {action.label}
          {action.emphasis === "secondary" && <span aria-hidden="true"> →</span>}
        </button>
      ))}
    </div>
  );
}
