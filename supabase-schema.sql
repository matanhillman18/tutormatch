-- ============================================================
-- TutorMatch v2 — Full Schema
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Drop old tables if exist (clean slate)
drop table if exists public.applications cascade;
drop table if exists public.tutoring_requests cascade;
drop table if exists public.tutors cascade;
drop table if exists public.parents cascade;

-- 1. PARENTS
create table public.parents (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  phone text not null default '',
  location text not null default '',
  created_at timestamptz not null default now()
);

-- 2. TUTORS
create table public.tutors (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  phone text not null default '',
  location text not null default '',
  subjects text[] not null default '{}',
  hourly_rate numeric not null check (hourly_rate > 0),
  bio text not null,
  teaching_format text not null default 'both' check (teaching_format in ('online','in_person','both')),
  created_at timestamptz not null default now()
);

-- 3. TUTORING REQUESTS
create table public.tutoring_requests (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.parents(id) on delete cascade,
  subject text not null,
  grade text not null,
  budget numeric not null check (budget > 0),
  description text not null,
  location text not null default '',
  lesson_type text not null default 'both' check (lesson_type in ('online','in_person','both')),
  created_at timestamptz not null default now()
);

-- 4. APPLICATIONS
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.tutors(id) on delete cascade,
  request_id uuid not null references public.tutoring_requests(id) on delete cascade,
  message text not null,
  availability text not null,
  phone text not null default '',
  status text not null default 'pending' check (status in ('pending','accepted','rejected')),
  created_at timestamptz not null default now(),
  unique(tutor_id, request_id)
);

-- 5. INDEXES
create index idx_requests_parent on public.tutoring_requests(parent_id);
create index idx_applications_tutor on public.applications(tutor_id);
create index idx_applications_request on public.applications(request_id);

-- 6. RLS
alter table public.parents enable row level security;
alter table public.tutors enable row level security;
alter table public.tutoring_requests enable row level security;
alter table public.applications enable row level security;

create policy "public_all_parents" on public.parents for all using (true) with check (true);
create policy "public_all_tutors" on public.tutors for all using (true) with check (true);
create policy "public_all_requests" on public.tutoring_requests for all using (true) with check (true);
create policy "public_all_applications" on public.applications for all using (true) with check (true);

-- ============================================================
-- 7. SEED — demo parent
-- ============================================================
insert into public.parents (full_name, email, phone, location)
values ('הורה לדוגמה', 'demo@tutormatch.co.il', '050-000-0000', 'תל אביב');

-- ============================================================
-- 8. SEED — 20 tutoring requests (Hebrew + English)
-- ============================================================

with demo_parent as (select id from public.parents where email = 'demo@tutormatch.co.il' limit 1)
insert into public.tutoring_requests (parent_id, subject, grade, budget, description, location, lesson_type)
select dp.id, r.subject, r.grade, r.budget, r.description, r.location, r.lesson_type
from demo_parent dp,
(values
  ('Mathematics','10',50,'הבן שלי מתקשה באלגברה וטריגונומטריה לקראת הבגרות. צריך מורה סבלני עם ניסיון בהוראה לתלמידים שמתקשים. 2 פעמים בשבוע.','תל אביב','both'),
  ('Physics','11',60,'מחפשת מורה פיזיקה עבור בתי לקראת בגרות. קשיים במכניקה וחשמל. מועמד עם ציון גבוה בבגרות בפיזיקה.','ירושלים','both'),
  ('English','7',35,'ילדי צריך עזרה בהבנת הנקרא וכתיבה באנגלית. אנגלית שפה שנייה לו. מורה עם גישה מעודדת ואדיבה.','חיפה','online'),
  ('Chemistry','12',65,'הכנה לבגרות כימיה 5 יחידות. כימיה אורגנית ותרמודינמיקה. מורה עם רקע אקדמי בכימיה.','תל אביב','online'),
  ('Computer Science','9',55,'הבת שלי רוצה ללמוד תכנות מאפס. מחפשת מישהו שמלמד Python בצורה כיפית ומעניינת.','אונליין','online'),
  ('History','8',30,'בני צריך עזרה בהיסטוריה. מיל"ד ב. גישת הוראה נעימה ומעניינת.','רעננה','in_person'),
  ('Biology','11',50,'מחפשת מורה ביולוגיה לקראת בגרות. גנטיקה, אקולוגיה וביולוגיה תאית. 2 פעמים בשבוע.','אונליין','online'),
  ('Mathematics','6',32,'בתי מתקשה בשברים ועשרוניות. מחפשת מורה חם ומעודד שיבנה את הביטחון שלה.','פתח תקווה','both'),
  ('Literature','10',40,'עזרה בניתוח ספרותי ועבודות עיוניות לבגרות. ניסיון בהוראת ספרות עברית.','תל אביב','in_person'),
  ('Mathematics','12',70,'הכנה אינטנסיבית לבגרות מתמטיקה 5 יחידות. מועמד עם הישגים גבוהים בלבד.','גבעתיים','in_person'),
  ('English','11',45,'שיפור כתיבה ודיבור באנגלית. דובר שפת אם עדיף. 3 פעמים בשבוע.','הרצליה','online'),
  ('Physics','12',65,'פיזיקה 5 יחידות — קוונטים וגלים. מחפש מורה שמסביר בצורה ברורה ויסודית.','ראשון לציון','both'),
  ('Mathematics','9',45,'קשיים בגיאומטריה ואלגברה. צריך מורה עם ניסיון בתלמידים שמתקשים.','נתניה','in_person'),
  ('Computer Science','11',60,'JavaScript ו-React. מתכנן לימודי מדעי המחשב. עדיפות למי שיש ניסיון בתעשייה.','אונליין','online'),
  ('Biology','9',40,'ביולוגיה כיתה ט. תאים, גנטיקה, אבולוציה. מורה עם סבלנות ויכולת הסבר טובה.','חדרה','both'),
  ('Economics','11',55,'כלכלה לבגרות. מאקרו ומיקרו כלכלה. מורה עם רקע בכלכלה.','תל אביב','online'),
  ('Mathematics','5',28,'חיזוק חשבון ובעיות מילוליות לכיתה ה. גישה משחקית וכיפית.','בת ים','in_person'),
  ('English','9',38,'שיפור ציונים באנגלית. קשיים בדקדוק ובניית משפטים. מורה עם ניסיון בכיתות י.','חולון','both'),
  ('Physics','10',55,'פיזיקה לבגרות. קשיים בכוח ותנועה. 2 פעמים בשבוע.','רמת גן','in_person'),
  ('Chemistry','10',50,'כימיה לבגרות. בעיות בתגובות כימיות ושיווי משקל. מורה עם ניסיון מוכח.','בני ברק','both')
) as r(subject, grade, budget, description, location, lesson_type);
