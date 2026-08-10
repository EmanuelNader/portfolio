import { experience } from "@/lib/experience";
import { projects } from "@/lib/projects";
import { site } from "@/lib/site";
import { ParticleFieldHost } from "./ParticleFieldHost";
import { ScrambleLink } from "./ScrambleLink";
import { StaggerIn } from "./StaggerIn";
import { WorkList } from "./WorkList";

type Props = {
  initialWorkSlug?: string | null;
};

export function HomePage({ initialWorkSlug = null }: Props) {
  return (
    <div className="site-shell">
      <ParticleFieldHost fullPage />
      <main className="page">
      <section className="section hero" aria-label="Introduction">
        <div className="hero-content">
          <StaggerIn immediate delayMs={0}>
            <h1 className="hero-name">{site.name}</h1>
          </StaggerIn>
          <StaggerIn immediate delayMs={60}>
            <p className="meta">{site.metaLine}</p>
          </StaggerIn>
          <StaggerIn immediate delayMs={120}>
            <p className="hero-body">{site.tagline}</p>
          </StaggerIn>
          <StaggerIn immediate delayMs={180}>
            <p className="hero-links">
              <ScrambleLink
                href={site.links.github}
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </ScrambleLink>
              <span className="hero-sep" aria-hidden="true">
                ·
              </span>
              <ScrambleLink
                href={site.links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </ScrambleLink>
              <span className="hero-sep" aria-hidden="true">
                ·
              </span>
              <ScrambleLink
                href={site.links.resume}
                target="_blank"
                rel="noopener noreferrer"
              >
                Résumé
              </ScrambleLink>
            </p>
          </StaggerIn>
        </div>
      </section>

      <section className="section" aria-labelledby="work-heading">
        <StaggerIn>
          <h2 id="work-heading" className="section-label">
            Work
          </h2>
        </StaggerIn>
        <WorkList projects={projects} initialSlug={initialWorkSlug} />
      </section>

      <section className="section" aria-labelledby="experience-heading">
        <StaggerIn>
          <h2 id="experience-heading" className="section-label">
            Experience
          </h2>
        </StaggerIn>
        <ul className="experience-list">
          {experience.map((job, index) => (
            <li key={job.company} className="experience-item">
              <StaggerIn delayMs={index * 60}>
                <h3 className="experience-company">{job.company}</h3>
                <p className="meta experience-meta">
                  {job.role} · {job.location} · {job.dates}
                </p>
                <div className="experience-lines">
                  {job.lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </StaggerIn>
            </li>
          ))}
        </ul>
      </section>

      <section className="section contact" aria-labelledby="contact-heading">
        <StaggerIn>
          <h2 id="contact-heading" className="section-label">
            Contact
          </h2>
          <p className="contact-lead">Open to interesting work — say hello.</p>
          <a className="contact-email" href={`mailto:${site.email}`}>
            {site.email}
          </a>
        </StaggerIn>
      </section>
      </main>
    </div>
  );
}
