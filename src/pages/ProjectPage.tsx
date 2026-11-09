import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase, Project } from "../supabase";

export default function ProjectPage() {
  const { id } = useParams();
  const [p, setP] = useState<Project | null | undefined>(undefined);

  useEffect(() => {
    if (!supabase || !id) { setP(null); return; }
    supabase.from("projects").select("*").eq("id", id).maybeSingle()
      .then(({ data }) => setP((data as Project) ?? null));
  }, [id]);

  if (p === undefined) return <p className="muted pad">טוען…</p>;
  if (p === null) return <p className="muted pad">הפרויקט לא נמצא. <Link to="/projects">לכל הפרויקטים</Link></p>;

  return (
    <article className="project">
      <h1>{p.title}</h1>
      <p className="lead">{p.description}</p>
      {p.cover_url && <img className="project-cover" src={p.cover_url} alt={p.title} />}
      {p.gallery?.length > 0 && (
        <>
          <h2>גלריה</h2>
          <div className="gallery">
            {p.gallery.map((src, i) => (
              <a href={src} key={src}><img src={src} alt={`${p.title}, תמונה ${i + 1}`} loading="lazy" /></a>
            ))}
          </div>
        </>
      )}
      <p className="back"><Link to="/projects">→ לכל הפרויקטים</Link></p>
    </article>
  );
}
