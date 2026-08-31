import { CertificationSchema, type Certification } from "../types/models";

/**
 * Content module: verified certification credentials.
 *
 * The four real, externally verifiable entries salvaged from the retired
 * Education page (education.ts). The Education timeline/milestones prose was
 * judge-approved low-signal and was dropped with the page; the credentials
 * are the unique surviving content and move into the Contact
 * [VERIFIED CREDENTIALS] strip (C2). Copied EXACTLY from education.ts:49-76
 * — titles, issuers, ids, and verify URLs are unchanged.
 *
 * Validated against CertificationSchema at module load — a mismatch throws a
 * descriptive error at import time (repo convention, see models.ts).
 */

export const credentials: Certification[] = [
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

const certificationValidation = CertificationSchema.array().safeParse(
  credentials,
);
if (!certificationValidation.success) {
  throw new Error(
    "content/credentials.ts: Certification data failed schema validation: " +
      certificationValidation.error.issues.map((issue) => issue.message).join(
        "; ",
      ),
  );
}