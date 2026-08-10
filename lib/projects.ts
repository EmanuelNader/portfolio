export type Project = {
  slug: string;
  name: string;
  fact: string;
  role: string;
  stack: string[];
  result: string;
  writeup: string;
  metric?: {
    value: number;
    prefix?: string;
    suffix?: string;
    label: string;
  };
};

export const projects: Project[] = [
  {
    slug: "shortstack",
    name: "ShortStack",
    fact: "93% faster redirects on cache hits",
    role: "Platform architecture",
    stack: ["Flask", "PostgreSQL", "Redis", "Nginx", "Docker", "Prometheus"],
    result: "Sub-2ms redirect latency under Locust load",
    writeup:
      "A production-style URL shortener with Redis caching, load-balanced Nginx, Dockerized services, and a full CI pipeline with Prometheus/Grafana monitoring.",
    metric: { value: 93, suffix: "%", label: "faster redirects" },
  },
  {
    slug: "healthbook",
    name: "HealthBook",
    fact: "30 min → under 3 min booking",
    role: "AI + automation",
    stack: ["Next.js", "FastAPI", "Browser Use", "OpenAI Realtime", "pgvector"],
    result: "Agentic booking with semantic health memory",
    writeup:
      "An AI appointment agent that browses sites like Zocdoc and places real phone calls via OpenAI Realtime API, with pgvector memory so you don't re-enter health history every time.",
    metric: { value: 90, suffix: "%", label: "less booking time" },
  },
  {
    slug: "nutribase",
    name: "Nutribase",
    fact: "ESP32 → MERN smart fridge",
    role: "IoT tracking",
    stack: ["MongoDB", "Express", "React", "Node.js", "C++", "ESP32"],
    result: "60% fewer waste/access tracking errors",
    writeup:
      "A smart-fridge tracker where ESP32 weight sensors stream live data into a MERN app with role-based auth and waste/analytics dashboards.",
    metric: { value: 60, suffix: "%", label: "fewer tracking errors" },
  },
  {
    slug: "quizki",
    name: "Quizki",
    fact: "Auth0 + Gemini study loops",
    role: "Full-stack product",
    stack: ["React", "Node.js", "Auth0", "Gemini", "MongoDB"],
    result: "Gamified sessions with personalized prompts",
    writeup:
      "A gamified study platform with progress dashboards, Auth0 login, and Gemini-powered personalized study prompts so sessions are quicker to start and more fun to finish.",
  },
  {
    slug: "autobook",
    name: "AutoBook",
    fact: "UCSD rooms the moment they open",
    role: "Automation",
    stack: ["Python", "Selenium", "WebDriver"],
    result: "Hands-off library room booking",
    writeup:
      "A Selenium bot that grabs hard-to-get UCSD library rooms the moment they open — no more clicking through a five-step booking flow by hand.",
  },
  {
    slug: "lockedin",
    name: "LockedIn",
    fact: "ESP32 + React/Node IoT triggers",
    role: "IoT + full-stack",
    stack: ["React", "Node.js", "Express", "MongoDB", "ESP32"],
    result: "Real-time device monitoring and workflows",
    writeup:
      "An IoT + web stack that connects ESP32 devices to a React/Node backend for real-time monitoring and automated workflow triggers.",
  },
  {
    slug: "discord-internship-job-board-bot",
    name: "discord-internship-job-board-bot",
    fact: "Scrape → role-channel alerts",
    role: "Discord bot",
    stack: ["Discord.js", "Node.js", "Web scraping"],
    result: "Deduped internship alerts by role family",
    writeup:
      "A Discord bot that scrapes internship, co-op, and fellowship postings, dedupes them, and drops each new listing into the right role-family channel with optional title ping roles.",
  },
  {
    slug: "shotclock",
    name: "ShotClock",
    fact: "Social nights-out memory app",
    role: "Mobile product",
    stack: ["Expo", "React Native", "Supabase"],
    result: "iOS-first MVP for capturing nights out",
    writeup:
      "A social memory-keeping app for nights out with friends — capture moments, people, and stories from a night in one place. iOS-first MVP on Expo, React Native, and Supabase.",
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}
