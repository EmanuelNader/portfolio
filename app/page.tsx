import { site } from "@/lib/site";

export default function Home() {
  return (
    <main className="smoke">
      <h1>{site.name}</h1>
      <p className="meta">{site.metaLine}</p>
      <p className="body">{site.tagline}</p>
    </main>
  );
}
