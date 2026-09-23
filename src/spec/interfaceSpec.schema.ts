import { z } from "zod";
import { componentSchemas } from "../components/registry/schemas";
import { intentSchema } from "../components/registry/schemas";

const componentNames = Object.keys(componentSchemas) as [
  keyof typeof componentSchemas,
  ...Array<keyof typeof componentSchemas>
];

/**
 * Structural shape of an interface specification. This is intentionally
 * loose about `props` (a record) because the props for each section are
 * validated separately against that component's own schema — see
 * validateInterfaceSpec below. Two-stage validation means a section can't
 * pass just by using an approved component name; its props must also match
 * that component's contract.
 */
export const interfaceSpecShape = z.object({
  state: z.enum(["planning", "disruption", "ready"]),
  intent: intentSchema,
  sections: z
    .array(
      z.object({
        id: z.string(),
        component: z.enum(componentNames),
        props: z.record(z.string(), z.unknown()),
        priority: z.number(),
      })
    )
    .min(1),
  trace: z
    .array(
      z.object({
        rule: z.string(),
        reason: z.string(),
      })
    )
    .default([]),
});

export type InterfaceSpecShape = z.infer<typeof interfaceSpecShape>;

export type ValidationResult =
  | { valid: true; spec: InterfaceSpecShape }
  | { valid: false; errors: string[] };

/**
 * Full validation: structural shape, THEN per-section props against the
 * approved component's own schema. Anything that fails either stage is
 * rejected — this is the single enforcement point that prevents an
 * upstream producer (rules engine today, LLM later) from inventing
 * components or props that the design system doesn't sanction.
 */
export function validateInterfaceSpec(input: unknown): ValidationResult {
  const structural = interfaceSpecShape.safeParse(input);
  if (!structural.success) {
    return {
      valid: false,
      errors: structural.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`
      ),
    };
  }

  const errors: string[] = [];
  for (const section of structural.data.sections) {
    const propsSchema = componentSchemas[section.component];
    const result = propsSchema.safeParse(section.props);
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push(
          `section "${section.id}" (${section.component}).${issue.path.join(
            "."
          )}: ${issue.message}`
        );
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, spec: structural.data };
}
