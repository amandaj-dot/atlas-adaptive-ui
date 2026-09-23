import type { z } from "zod";
import type { sectionHeaderSchema } from "../registry/schemas";
import "./SectionHeader.css";

type SectionHeaderProps = z.infer<typeof sectionHeaderSchema>;

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <h2 className="section-header__title">{title}</h2>
      {subtitle && <p className="section-header__subtitle">{subtitle}</p>}
    </div>
  );
}
