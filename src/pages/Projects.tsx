import { Link } from "react-router-dom";
import { useProjects } from "../useProjects";

export default function Projects() {
  const { projects } = useProjects();
  return (
    <>
      <section className="intro">
        <h1>פרויקטים</h1>
        <p>מבחר עבודות מהשנים האחרונות.</p>
      </section>
      <section className="projects">
        {projects === null && <p className="muted">טוען…</p>}
        {projects?.length === 0 && <p className="muted">עדיין אין פרויקטים.</p>}
        {projects?.map((p) => (
          <Link className="project-item" to={`/projects/${p.id}`} key={p.id}>
            {p.cover_url && <img src={p.cover_url} alt={p.title} loading="lazy" />}
            <h2>{p.title}</h2>
            <p>{p.description}</p>
          </Link>
        ))}
      </section>
    </>
  );
}
