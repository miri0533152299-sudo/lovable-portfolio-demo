import { useEffect, useState } from "react";
import { supabase, Project } from "./supabase";

// טוען את הפרויקטים ממסד הנתונים בכל כניסה לעמוד.
// לכן פרויקט שהלקוחה הוסיפה מופיע מיד, בלי לפרסם את האתר מחדש.
export function useProjects() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!supabase) { setError("המסד עוד לא מחובר"); setProjects([]); return; }
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    setProjects((data as Project[]) ?? []);
  };

  useEffect(() => { load(); }, []);
  return { projects, error, reload: load };
}
