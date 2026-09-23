import type { z } from "zod";
import type { taskCardSchema } from "../registry/schemas";
import "./TaskCard.css";

type TaskCardSchemaProps = z.infer<typeof taskCardSchema>;

/**
 * TaskCardProps = the validated schema data, PLUS an optional UI
 * callback. onComplete is deliberately NOT part of taskCardSchema: a
 * Zod schema describes data an upstream source (the rules engine today,
 * an LLM later) is allowed to produce — a function isn't data, can't be
 * validated or serialized, and has no business being something a rule
 * module emits. SpecRenderer attaches this callback directly, the same
 * way it attaches `key`; it never flows through validateInterfaceSpec.
 */
type TaskCardProps = TaskCardSchemaProps & {
  onComplete?: () => void;
};

const statusLabel: Record<TaskCardSchemaProps["status"], string> = {
  complete: "Done",
  incomplete: "To do",
  urgent: "Needs attention",
};

export function TaskCard({ title, description, status, onComplete }: TaskCardProps) {
  return (
    <div className={`task-card task-card--${status}`}>
      <div className="task-card__body">
        <p className="task-card__title">{title}</p>
        <p className="task-card__description">{description}</p>
      </div>
      <div className="task-card__footer">
        {status !== "incomplete" && (
          <span className={`task-card__status task-card__status--${status}`}>
            {statusLabel[status]}
          </span>
        )}
        {status !== "complete" && onComplete && (
          <button type="button" className="task-card__complete" onClick={onComplete}>
            Mark complete <span aria-hidden="true">→</span>
          </button>
        )}
      </div>
    </div>
  );
}
