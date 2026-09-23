import { z } from "zod";

/**
 * Machine-readable schemas for the approved component vocabulary.
 * This is the enforcement point: any interface specification (from the
 * rules engine today, an LLM later) must produce props that satisfy one
 * of these schemas or it will not render. Adding a new component means
 * adding a schema here AND registering it in componentRegistry.tsx —
 * neither alone is enough, which is deliberate.
 */

export const intentSchema = z.enum(["prepare", "recover", "confirm"]);

export const bannerSchema = z.object({
  tone: z.enum(["info", "alert", "success"]),
  title: z.string(),
  message: z.string(),
});

export const sectionHeaderSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
});

export const taskCardSchema = z.object({
  title: z.string(),
  description: z.string(),
  status: z.enum(["complete", "incomplete", "urgent"]),
});

export const actionGroupSchema = z.object({
  actions: z
    .array(
      z.object({
        id: z.enum(["preview-rebooking", "preview-support", "view-journey"]),
        label: z.string(),
        emphasis: z.enum(["primary", "secondary"]),
      })
    )
    .min(1),
});

export const statusListSchema = z.object({
  items: z
    .array(
      z.object({
        label: z.string(),
        status: z.enum(["complete", "incomplete", "urgent"]),
      })
    )
    .min(1),
});

/**
 * A labeled piece of reference information (e.g. a flight or hotel
 * detail), with up to two supporting lines. Deliberately has no status/
 * completion semantics — unlike TaskCard, DetailCard makes no claim
 * about anything being "done"; it's for facts, not tasks.
 */
export const detailCardSchema = z.object({
  label: z.string(),
  primary: z.string(),
  secondary: z.string().optional(),
});

/** Every approved component name, and the schema that governs its props. */
export const componentSchemas = {
  Banner: bannerSchema,
  SectionHeader: sectionHeaderSchema,
  TaskCard: taskCardSchema,
  ActionGroup: actionGroupSchema,
  StatusList: statusListSchema,
  DetailCard: detailCardSchema,
} as const;

export type ComponentName = keyof typeof componentSchemas;
export type ActionId = z.infer<typeof actionGroupSchema>["actions"][number]["id"];
