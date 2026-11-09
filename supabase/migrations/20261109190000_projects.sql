-- פרויקטים באתר, ומי מורשית לערוך אותם.
-- כולם יכולים לקרוא. רק מיילים שברשימת editors יכולים להוסיף, לערוך ולמחוק.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  cover_url text,
  gallery text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.editors (
  email text primary key
);

create or replace function public.is_editor()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.editors
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

alter table public.projects enable row level security;
alter table public.editors enable row level security;

drop policy if exists "projects are public" on public.projects;
create policy "projects are public" on public.projects for select using (true);
drop policy if exists "editors insert" on public.projects;
create policy "editors insert" on public.projects for insert to authenticated with check (public.is_editor());
drop policy if exists "editors update" on public.projects;
create policy "editors update" on public.projects for update to authenticated using (public.is_editor()) with check (public.is_editor());
drop policy if exists "editors delete" on public.projects;
create policy "editors delete" on public.projects for delete to authenticated using (public.is_editor());

-- מחוברת רואה רק את השורה שלה, כדי לדעת אם היא מורשית
drop policy if exists "see own editor row" on public.editors;
create policy "see own editor row" on public.editors for select to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- תמונות
insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', true)
on conflict (id) do nothing;

drop policy if exists "project images public read" on storage.objects;
create policy "project images public read" on storage.objects for select using (bucket_id = 'project-images');
drop policy if exists "editors upload images" on storage.objects;
create policy "editors upload images" on storage.objects for insert to authenticated with check (bucket_id = 'project-images' and public.is_editor());
drop policy if exists "editors update images" on storage.objects;
create policy "editors update images" on storage.objects for update to authenticated using (bucket_id = 'project-images' and public.is_editor());
drop policy if exists "editors delete images" on storage.objects;
create policy "editors delete images" on storage.objects for delete to authenticated using (bucket_id = 'project-images' and public.is_editor());

-- פרויקטים לדוגמה
insert into public.projects (title, description, cover_url, gallery, created_at)
select * from (values
  ('דירת גן בגבעתיים', 'שיפוץ מלא לדירת ארבעה חדרים, עם מטבח פתוח לחצר ופלטת צבעים של עץ, אבן וטרקוטה.', '/samples/sample-1-cover.jpg', '{}'::text[], now() - interval '3 day'),
  ('קליניקה לפיזיותרפיה ברמת גן', 'חלל טיפולים שקט ובהיר, עם תאורה רכה, מחיצות עץ וחדר המתנה שמרגיש כמו סלון.', '/samples/sample-2-cover.jpg', '{}'::text[], now() - interval '2 day'),
  ('בית קפה שכונתי בפלורנטין', 'מיתוג ועיצוב חלל לבית קפה קטן, מהלוגו ועד הדלפק, בהשראת בתי המלאכה של השכונה.', '/samples/sample-3-cover.jpg', '{}'::text[], now() - interval '1 day')
) as v(title, description, cover_url, gallery, created_at)
where not exists (select 1 from public.projects);

-- המיילים שמורשים לערוך. מחליפים לכתובות האמיתיות.
-- insert into public.editors (email) values ('client@example.com'), ('designer@example.com');
