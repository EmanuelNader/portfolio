export type Experience = {
  company: string;
  role: string;
  location: string;
  dates: string;
  lines: string[];
  /** Public path under /public, e.g. /logos/tesla.svg */
  logoSrc?: string;
  logoAlt?: string;
};

export const experience: Experience[] = [
  {
    company: "Tesla",
    role: "Technical Program Manager Intern — Chassis Controls",
    location: "Palo Alto, CA",
    dates: "Jun 2026 – Present",
    logoSrc: "/logos/tesla.png",
    logoAlt: "Tesla",
    lines: [
      "Rebuilt an internal fleet-planning console in React/Vite/Tailwind on Flask/SQLite for 7 Vehicle Software teams, cutting manual cross-checking by 75%.",
      "Designed a weighted release-scoring algorithm ranking 350+ vehicles 0–100 across five metrics with scarcity-protection caps.",
      "Reconciled three internal systems into four-stage source-of-truth tables tracking approval, parts, technician, and completion.",
    ],
  },
  {
    company: "HP Tech Ventures",
    role: "Software Engineering Extern (Technical Analyst)",
    location: "Remote",
    dates: "Feb 2026 – Apr 2026",
    logoSrc: "/logos/hp.png",
    logoAlt: "HP",
    lines: [
      "Cut due diligence cycle time by 40%, saving 15+ hours/week, by building Python scrapers that aggregated and cleaned 10,000+ market records into structured investment reports.",
      "Halved technical risk analysis time (4 hrs to under 2 hrs/report) by building an LLM-powered research tool using NLP pipelines to auto-generate structured competitive landscape briefs.",
    ],
  },
];
