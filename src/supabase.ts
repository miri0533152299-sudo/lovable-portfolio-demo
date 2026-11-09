import { createClient } from "@supabase/supabase-js";

// החיבור למסד הנתונים של Lovable Cloud.
// Lovable ממלא את שני הערכים האלה לבד, כשמפעילים Lovable Cloud בפרויקט.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const cloudReady = Boolean(url && key);
export const supabase = cloudReady ? createClient(url!, key!) : null;

export type Project = {
  id: string;
  title: string;
  description: string;
  cover_url: string | null;
  gallery: string[];
  created_at: string;
};

export const BUCKET = "project-images";
