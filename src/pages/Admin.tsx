import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase, cloudReady, Project, BUCKET } from "../supabase";
import { useProjects } from "../useProjects";

// מקטין תמונה בדפדפן לפני ההעלאה (עד 2000 פיקסלים, JPEG),
// כדי שתמונה כבדה מהטלפון לא תיתקע.
async function shrink(file: File): Promise<Blob> {
  const img = await createImageBitmap(file);
  const max = 2000;
  const k = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * k);
  c.height = Math.round(img.height * k);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return await new Promise((res) => c.toBlob((b) => res(b!), "image/jpeg", 0.85));
}

async function upload(file: File): Promise<string> {
  const blob = await shrink(file);
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await supabase!.storage.from(BUCKET).upload(name, blob, { contentType: "image/jpeg" });
  if (error) throw error;
  return supabase!.storage.from(BUCKET).getPublicUrl(name).data.publicUrl;
}

function Login() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg("");
    const { error } = mode === "in"
      ? await supabase!.auth.signInWithPassword({ email, password: pass })
      : await supabase!.auth.signUp({ email, password: pass, options: { emailRedirectTo: window.location.origin + "/admin" } });
    setBusy(false);
    if (error) setMsg(error.message === "Invalid login credentials" ? "המייל או הסיסמה לא נכונים" : error.message);
    else if (mode === "up") setMsg("נרשמת! אם הגיע אלייך מייל אישור, לוחצות עליו וחוזרות לכאן.");
  };

  return (
    <form className="card login" onSubmit={submit}>
      <h1>{mode === "in" ? "כניסה לעריכת האתר" : "הרשמה ראשונה"}</h1>
      <label>מייל<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" /></label>
      <label>סיסמה<input type="password" required minLength={6} value={pass} onChange={(e) => setPass(e.target.value)} dir="ltr" /></label>
      <button className="btn" disabled={busy}>{mode === "in" ? "כניסה" : "הרשמה"}</button>
      {msg && <p className="msg">{msg}</p>}
      <button type="button" className="link" onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(""); }}>
        {mode === "in" ? "פעם ראשונה כאן? הרשמה" : "כבר נרשמת? כניסה"}
      </button>
    </form>
  );
}

function Editor({ project, onDone }: { project: Project | null; onDone: () => void }) {
  const [title, setTitle] = useState(project?.title ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [cover, setCover] = useState<string | null>(project?.cover_url ?? null);
  const [gallery, setGallery] = useState<string[]>(project?.gallery ?? []);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  const addCover = async (f?: File) => {
    if (!f) return;
    setBusy("מעלה תמונה…"); setErr("");
    try { setCover(await upload(f)); } catch (e: any) { setErr(e.message); }
    setBusy("");
  };
  const addGallery = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(`מעלה ${files.length} תמונות…`); setErr("");
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) urls.push(await upload(f));
      setGallery((g) => [...g, ...urls]);
    } catch (e: any) { setErr(e.message); }
    setBusy("");
  };
  const save = async () => {
    if (!title.trim() || !description.trim() || !cover) { setErr("צריך שם, תיאור ותמונה ראשית"); return; }
    setBusy("שומרת…"); setErr("");
    const row = { title: title.trim(), description: description.trim(), cover_url: cover, gallery };
    const { error } = project
      ? await supabase!.from("projects").update(row).eq("id", project.id)
      : await supabase!.from("projects").insert(row);
    setBusy("");
    if (error) setErr(error.message); else onDone();
  };

  return (
    <div className="card editor">
      <h2>{project ? "עריכת פרויקט" : "פרויקט חדש"}</h2>
      <label>שם הפרויקט<input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
      <label>תיאור<textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></label>
      <div className="field">
        <span>תמונה ראשית</span>
        {cover && <img className="thumb" src={cover} alt="" />}
        <label className="btn ghost">העלאת תמונה<input type="file" accept="image/*" hidden onChange={(e) => addCover(e.target.files?.[0])} /></label>
      </div>
      <div className="field">
        <span>גלריה</span>
        <div className="thumbs">
          {gallery.map((g) => (
            <span className="thumbwrap" key={g}>
              <img className="thumb" src={g} alt="" />
              <button type="button" aria-label="הסרת תמונה" onClick={() => setGallery(gallery.filter((x) => x !== g))}>×</button>
            </span>
          ))}
        </div>
        <label className="btn ghost">הוספת תמונות<input type="file" accept="image/*" multiple hidden onChange={(e) => addGallery(e.target.files)} /></label>
      </div>
      {busy && <p className="msg">{busy}</p>}
      {err && <p className="msg err">{err}</p>}
      <div className="row">
        <button className="btn" onClick={save} disabled={!!busy}>שמירה</button>
        <button className="link" onClick={onDone}>ביטול</button>
      </div>
    </div>
  );
}

export default function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [isEditor, setIsEditor] = useState<boolean | null>(null);
  const [editing, setEditing] = useState<Project | "new" | null>(null);
  const { projects, reload } = useProjects();

  useEffect(() => {
    if (!supabase) { setReady(true); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session || !supabase) { setIsEditor(null); return; }
    supabase.from("editors").select("email").maybeSingle().then(({ data }) => setIsEditor(!!data));
  }, [session]);

  const remove = async (p: Project) => {
    if (!window.confirm(`למחוק את "${p.title}"? אי אפשר לבטל.`)) return;
    await supabase!.from("projects").delete().eq("id", p.id);
    reload();
  };

  if (!cloudReady) return <div className="admin"><p className="card">המסד עוד לא מחובר. צריך להפעיל Lovable Cloud בפרויקט.</p></div>;
  if (!ready) return <div className="admin"><p className="muted">טוען…</p></div>;

  return (
    <div className="admin">
      <header className="admin-top">
        <Link to="/" className="logo">סטודיו נועה לב</Link>
        {session && <button className="link" onClick={() => supabase!.auth.signOut()}>יציאה</button>}
      </header>
      {!session && <Login />}
      {session && isEditor === false && (
        <p className="card">המייל {session.user.email} לא מורשה לערוך את האתר. כדאי לפנות למעצבת.</p>
      )}
      {session && isEditor && (editing ? (
        <Editor project={editing === "new" ? null : editing} onDone={() => { setEditing(null); reload(); }} />
      ) : (
        <>
          <div className="row between">
            <h1>הפרויקטים באתר</h1>
            <button className="btn" onClick={() => setEditing("new")}>+ פרויקט חדש</button>
          </div>
          <ul className="admin-list">
            {projects?.map((p) => (
              <li key={p.id}>
                {p.cover_url && <img className="thumb" src={p.cover_url} alt="" />}
                <span className="t">{p.title}</span>
                <button className="link" onClick={() => setEditing(p)}>עריכה</button>
                <button className="link danger" onClick={() => remove(p)}>מחיקה</button>
              </li>
            ))}
          </ul>
          <p className="muted">מה ששומרים כאן מופיע באתר מיד, בלי לפרסם.</p>
        </>
      ))}
    </div>
  );
}
