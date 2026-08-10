export type Project = {
  slug: string;
  name: string;
  /** Hover-preview one-liner — mirrors the RESULT sharpness. */
  fact: string;
  stack: string[];
  /** What it is and what it does (team context lives here as a clause). */
  description: string;
  /**
   * Sharpest concrete fact — required on every card.
   * Metric numbers use `metric` for accent/count-up rendering; otherwise
   * this string renders as a normal RESULT sentence.
   */
  result: string;
  /** Public repo — shown as a GitHub link in the breakdown popup when set. */
  repoUrl?: string;
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
    fact: "Redis caching cut redirect latency from ~30ms to ~2ms (93% faster)",
    stack: [
      "Flask",
      "Peewee ORM",
      "PostgreSQL",
      "Redis",
      "Nginx",
      "Docker",
      "Prometheus/Grafana",
    ],
    description:
      "Production-grade URL shortener built for the MLH Production Engineering hackathon — 3 load-balanced app replicas behind Nginx, full CRUD API over 3 Postgres models, and Prometheus/Grafana dashboards tracking traffic and cache performance. 25 tests at 84% coverage, CI on every push.",
    result:
      "Redis caching cut redirect latency from ~30ms to ~2ms on cache hits (93% faster)",
    metric: { value: 93, suffix: "%", label: "faster redirects on cache hits" },
  },
  {
    slug: "trackbench",
    name: "trackbench",
    fact: "Identity switches cut 890 → 415 (−53%)",
    stack: [
      "C++17",
      "Eigen",
      "Hungarian Algorithm",
      "EKF",
      "Express/Prisma",
      "React",
      "nuScenes",
    ],
    description:
      "Debugging tool for multi-object tracking on real driving logs. A classical (non-neural) C++ tracker runs on public nuScenes detections, gets scored on standard MOT metrics, and every identity switch gets mined into a bird's-eye triage UI so you can see the actual frame where a tracker confused two objects, not just a single opaque score. Changes get gated in CI so regressions can't slip back in.",
    result:
      "Identity switches cut 890 → 415 (−53%) on nuScenes mini across three findings, including one honest null result",
    repoUrl: "https://github.com/EmanuelNader/trackbench",
    metric: {
      value: 53,
      prefix: "−",
      suffix: "%",
      label: "identity switches on nuScenes mini",
    },
  },
  {
    slug: "nutribase",
    name: "Nutribase",
    fact: "Used by a 10-person dorm suite for 10 weeks",
    stack: [
      "ESP32",
      "HX711 Load Cell",
      "RFID",
      "React/TypeScript",
      "Node.js/Express",
      "MongoDB",
      "WebSocket",
    ],
    description:
      "Smart fridge tracker for households — an ESP32 with a load cell and RFID reader logs food weight and ownership in real time, streaming over WiFi to a shared React dashboard where roommates can see who added what, track expiration, and cut down food waste. Includes a custom 3D-printed enclosure to house the hardware inside an actual fridge.",
    result: "Used by a 10-person dorm suite for 10 weeks",
    repoUrl: "https://github.com/EmanuelNader/Nutribase",
  },
  {
    slug: "quizki",
    name: "Quizki",
    fact: "Full-stack flashcards, AI tests, and gacha — in 24 hours",
    stack: [
      "MongoDB",
      "Express",
      "React",
      "Node.js",
      "Auth0",
      "Google Gemini API",
      "motion.dev",
    ],
    description:
      "Gamified flashcard platform built in 24 hours at UCSD's DiamondHacks, with one of four teammates. Students create custom flashcards, take Gemini-generated practice tests, and earn points to spend on a gacha-style blind-box system — collecting digital Smiskis as a reward loop for actually studying. Gemini also powers a personality-driven tutor chatbot alongside the test generation.",
    result:
      "Built full-stack — auth, AI-generated tests, and a working gacha reward system — in 24 hours",
    repoUrl: "https://github.com/EmanuelNader/Quizki",
  },
  {
    slug: "autobook",
    name: "AutoBook",
    fact: "Eliminated manual Geisel study-room booking",
    stack: ["Python", "Selenium", "WebDriver"],
    description:
      "Automates reserving study rooms at Geisel Library (UCSD) via the LibCal reservation system — the bot picks configured time slots and rooms, logs in, and confirms the reservation so you don't have to click through the flow by hand.",
    result: "Eliminated manual Geisel study-room booking",
  },
  {
    slug: "shotclock",
    name: "ShotClock",
    fact: "iOS-first MVP for capturing nights out",
    stack: [
      "React Native",
      "Expo",
      "TypeScript",
      "Supabase (Postgres, Auth, Realtime, Storage)",
      "TanStack Query",
      "Zustand",
      "Reanimated",
      "EAS Build",
    ],
    description:
      "A social memory-keeping app for nights out with friends — capture moments, people, and stories from a night in one place. iOS-first MVP on Expo, React Native, and Supabase.",
    result: "iOS-first MVP for capturing nights out in one place",
    repoUrl: "https://github.com/EmanuelNader/shotoclock",
  },
  {
    slug: "healthbook",
    name: "HealthBook",
    fact: "Cut booking from ~30 minutes to under 3",
    stack: ["Next.js", "FastAPI", "Browser Use", "OpenAI Realtime", "pgvector"],
    description:
      "An AI appointment agent that browses sites like Zocdoc and places real phone calls via the OpenAI Realtime API, with pgvector memory so you don't re-enter health history every time.",
    result: "Cut a typical booking flow from ~30 minutes to under 3",
    metric: { value: 90, suffix: "%", label: "less time to book" },
  },
  {
    slug: "lockedin",
    name: "LockedIn",
    fact: "ESP32 devices drive real-time workflow triggers",
    stack: ["React", "Node.js", "Express", "MongoDB", "ESP32"],
    description:
      "An IoT + web stack that connects ESP32 devices to a React/Node backend for real-time monitoring and automated workflow triggers.",
    result: "Live ESP32 telemetry with automated workflow triggers",
  },
  {
    slug: "discord-internship-job-board-bot",
    name: "discord-internship-job-board-bot",
    fact: "Deduped internship alerts routed by role family",
    stack: ["Discord.js", "Node.js", "Web scraping"],
    description:
      "A Discord bot that scrapes internship, co-op, and fellowship postings, dedupes them, and drops each new listing into the right role-family channel with optional title ping roles.",
    result: "Deduped internship alerts routed by role family",
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}
