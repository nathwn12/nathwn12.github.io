import {
  CertificationSchema,
  EducationItemSchema,
  type Certification,
} from "../types/models";

/**
 * Content module: Education section data, moved verbatim out of
 * src/components/Education.tsx. Validated against the (formerly dormant)
 * zod models at module load. Rendered output must stay byte-identical.
 */

export interface TimelineItem {
  year: string;
  label: string;
  school: string;
  desc: string;
  dotClass: string;
  textClass: string;
}

export const timeline: TimelineItem[] = [
  {
    year: "2017",
    label: "STEM STRAND",
    school: "La Consolacion University Philippines",
    desc: "Science, Technology, Engineering and Mathematics · 2017–2019",
    dotClass: "bg-accent-4",
    textClass: "text-accent-4",
  },
  {
    year: "2019",
    label: "BS INFORMATION TECHNOLOGY",
    school: "La Consolacion University Philippines",
    desc: "Bachelor of Science in Information Technology · 2019–2023",
    dotClass: "bg-accent-2",
    textClass: "text-accent-2",
  },
  {
    year: "2023",
    label: "CERTIFICATIONS WAVE",
    school: "Coursera · APIsec University",
    desc: "Google IT Automation with Python · Google IT Support · API Security Fundamentals · OWASP API Security Top 10",
    dotClass: "bg-accent",
    textClass: "text-accent",
  },
];

export const certifications: Certification[] = [
  {
    title: "Google IT Automation with Python",
    issuer: "Coursera",
    id: "RFS2G5ZT9GPK",
    url: "https://www.coursera.org/share/3ca99757aef54a931fa0ffdafd7e6a04",
  },
  {
    title: "Google IT Support",
    issuer: "Coursera",
    id: "NEBB575RT5LU",
    url: "https://www.coursera.org/share/0ed5c57a2de3e858c4629cc9f209b99f",
  },
  {
    title: "API Security Fundamentals",
    issuer: "APIsec University",
    date: "Aug 2023",
    id: "FA69CEB39205E003",
    url: "https://www.credly.com/badges/66cf7672-0ef2-4f94-8e17-b3bc6263b364/public_url",
  },
  {
    title: "OWASP API Security Top 10",
    issuer: "APIsec University",
    date: "Aug 2023",
    id: "FC46A72A0806A19E",
    url: "https://www.credly.com/badges/8aeb5515-665f-4c0a-bfe6-640c314f1311/public_url",
  },
];

export const milestoneCount = timeline.length;
export const credentialCount = certifications.length;

/* Dormant zod models wired in: validate domain projections (Tailwind
   class → palette hex) at module load. Certifications validate directly. */
const CLASS_HEX: Record<string, string> = {
  "bg-accent": "#8ae234",
  "bg-accent-2": "#729fcf",
  "bg-accent-4": "#ad7fa8",
};

const educationProjection = timeline.map((item) => ({
  year: item.year,
  label: item.label,
  school: item.school,
  desc: item.desc,
  dotColor: CLASS_HEX[item.dotClass] ?? "#8ae234",
  textColor: CLASS_HEX[item.textClass.replace("text-", "bg-")] ?? "#8ae234",
}));

const educationValidation = EducationItemSchema.array().safeParse(
  educationProjection,
);
if (!educationValidation.success) {
  throw new Error(
    "content/education.ts: Education data failed schema validation: " +
      educationValidation.error.issues.map((issue) => issue.message).join(
        "; ",
      ),
  );
}

const certificationValidation = CertificationSchema.array().safeParse(
  certifications,
);
if (!certificationValidation.success) {
  throw new Error(
    "content/education.ts: Certification data failed schema validation: " +
      certificationValidation.error.issues.map((issue) => issue.message).join(
        "; ",
      ),
  );
}