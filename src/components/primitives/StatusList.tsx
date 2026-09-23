import type { z } from "zod";
import type { statusListSchema } from "../registry/schemas";
import "./StatusList.css";

type StatusListProps = z.infer<typeof statusListSchema>;

export function StatusList({ items }: StatusListProps) {
  return (
    <ul className="status-list">
      {items.map((item) => (
        <li key={item.label} className="status-list__item">
          <span className={`status-list__dot status-list__dot--${item.status}`} aria-hidden="true" />
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}
