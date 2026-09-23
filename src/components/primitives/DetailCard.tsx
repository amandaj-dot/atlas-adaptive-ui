import type { z } from "zod";
import type { detailCardSchema } from "../registry/schemas";
import "./DetailCard.css";

type DetailCardProps = z.infer<typeof detailCardSchema>;

export function DetailCard({ label, primary, secondary }: DetailCardProps) {
  return (
    <div className="detail-card">
      <span className="detail-card__label">{label}</span>
      <span className="detail-card__content">
        <span className="detail-card__primary">{primary}</span>
        {secondary && <span className="detail-card__secondary">{secondary}</span>}
      </span>
    </div>
  );
}
