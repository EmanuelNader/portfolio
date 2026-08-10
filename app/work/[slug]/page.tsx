import { notFound } from "next/navigation";
import { getProject, projects } from "@/lib/projects";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return {
    title: `${project.name} — Emanuel Nader`,
    description: project.description,
  };
}

export default async function WorkPage({ params }: Props) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  // UI lives in PortfolioShell; this route exists for URLs + metadata.
  return null;
}
