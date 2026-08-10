import { experience } from "@/lib/experience";
import { projects } from "@/lib/projects";
import { site } from "@/lib/site";

export default function Home() {
  return (
    <main className="page">
      <section className="section hero" aria-label="Introduction">
        <h1 className="hero-name">{site.name}</h1>
        <p className="meta">{site.metaLine}</p>
        <p className="hero-body">{site.tagline}</p>
        <p className="hero-links">
          <a
            href={site.links.github}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <span className="hero-sep" aria-hidden="true">
            ·
          </span>
          <a
            href={site.links.linkedin}
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </a>
          <span className="hero-sep" aria-hidden="true">
            ·
          </span>
          <a
            href={site.links.resume}
            target="_blank"
            rel="noopener noreferrer"
          >
            Résumé
          </a>
        </p>
      </section>

      <section className="section" aria-labelledby="work-heading">
        <h2 id="work-heading" className="section-label">
          Work
        </h2>
        <ul className="work-list">
          {projects.map((project) => (
            <li key={project.slug} className="work-row">
              <h3 className="work-name">{project.name}</h3>
            </li>
          ))}
        </ul>
      </section>

      <section className="section" aria-labelledby="experience-heading">
        <h2 id="experience-heading" className="section-label">
          Experience
        </h2>
        <ul className="experience-list">
          {experience.map((job) => (
            <li key={job.company} className="experience-item">
              <h3 className="experience-company">{job.company}</h3>
              <p className="meta experience-meta">
                {job.role} · {job.location} · {job.dates}
              </p>
              <div className="experience-lines">
                {job.lines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="section contact" aria-labelledby="contact-heading">
        <h2 id="contact-heading" className="section-label">
          Contact
        </h2>
        <p className="contact-lead">
          Open to interesting work — say hello.
        </p>
        <a className="contact-email" href={`mailto:${site.email}`}>
          {site.email}
        </a>
      </section>
    </main>
  );
}
