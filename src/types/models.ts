import { z } from "zod";

// ============================================
// PHASE 1: Foundation - Shared Data Models with Zod
// ============================================

/** Experience entry schema */
export const ExperienceSchema = z.object({
  id: z.string(),
  role: z.string(),
  company: z.string(),
  period: z.string(),
  location: z.string().optional(),
  description: z.string(),
  tech: z.array(z.string()),
  highlight: z.boolean(),
});
export type Experience = z.infer<typeof ExperienceSchema>;

/** Skill with proficiency level */
export const SkillSchema = z.object({
  name: z.string(),
  level: z.number().min(0).max(100),
});
export type Skill = z.infer<typeof SkillSchema>;

/** Skill category containing related skills */
export const SkillCategorySchema = z.object({
  category: z.string(),
  skills: z.array(SkillSchema),
});
export type SkillCategory = z.infer<typeof SkillCategorySchema>;

/** Project entry schema */
export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  tech: z.array(z.string()),
  status: z.enum(["PRODUCTION", "SHIPPED"]),
  color: z.string().regex(/^#[0-9a-fA-F]{3,8}$/),
  stats: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
      color: z.string().regex(/^#[0-9a-fA-F]{3,8}$/),
    })
  ),
});
export type Project = z.infer<typeof ProjectSchema>;

/** Education timeline item */
export const EducationItemSchema = z.object({
  year: z.string(),
  label: z.string(),
  school: z.string(),
  desc: z.string(),
  dotColor: z.string().regex(/^#[0-9a-fA-F]{3,8}$/),
  textColor: z.string(),
});
export type EducationItem = z.infer<typeof EducationItemSchema>;

/** Certificate link data */
export const CertificationSchema = z.object({
  title: z.string(),
  issuer: z.string(),
  date: z.string().optional(),
  id: z.string().uuid(),
  url: z.string().url(),
});
export type Certification = z.infer<typeof CertificationSchema>;

// ============================================
// PHASE 1.5: Branded Types for Domain Primitives
// ============================================

/** Experience ID - prevents passing ExperienceId where UserId expected */
export type ExperienceId = string & { readonly __brand: "Experience" };

/** Skill Level with range validation at compile time */
export type SkillLevel = number & { readonly __brand: "SkillLevel" };

// ============================================
// PHASE 2: Type Guards & Exhaustive Switches
// ============================================

export function isExperience(data: unknown): data is Experience {
  return ExperienceSchema.safeParse(data).success;
}

export function isProject(data: unknown): data is Project {
  return ProjectSchema.safeParse(data).success;
}

export function isSkillCategory(data: unknown): data is SkillCategory {
  return SkillCategorySchema.safeParse(data).success;
}

// ============================================
// PHASE 2.5: Runtime Validation with Zod (API Boundaries)
// ============================================

/** Fetch and validate Experience from API */
export async function fetchExperiences(): Promise<Experience[]> {
  const response = await fetch("/api/experiences");
  if (!response.ok) {
    throw new Error(`fetch experiences failed: ${response.status}`);
  }
  return ExperienceSchema.array().parse(await response.json());
}

/** Safe parse user input for skill level */
export function parseSkillLevel(input: string): Skill | null {
  const result = SkillSchema.safeParse({
    name: "Unknown",
    level: parseInt(input, 10),
  });
  return result.success ? result.data : null;
}

// ============================================
// PHASE 3: Utility Types & Zod Extensions
// ============================================

/** Optional field with custom validation */
export function optionalWith<T>(schema: z.ZodType<T>) {
  return schema.optional().or(z.literal(""));
}

/** Transform dates at parse time */
export const DateSchema = z.string().transform((s) => new Date(s));
