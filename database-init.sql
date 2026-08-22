-- EchoBody Database Schema
-- Run this in the Supabase SQL Editor

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Create profiles table
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  name text not null,
  role text not null check (role in ('teacher', 'student', 'admin')),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- 3. Enable RLS
alter table profiles enable row level security;

-- 4. RLS policies
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

create policy "Users can insert their own profile"
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update their own profile"
  on profiles for update
  using ( auth.uid() = id );

create policy "Teachers can update all profiles"
  on profiles for update
  using ( exists ( select 1 from profiles where id = auth.uid() and role = 'teacher' ) );

-- 5. Auto-create profile on signup
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role)
  values (new.id, new.raw_user_meta_data->>'name', coalesce(new.raw_user_meta_data->>'role', 'student'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. Create anonymous_questions table
create table anonymous_questions (
  id uuid not null default uuid_generate_v4() primary key,
  content text not null,
  is_public boolean not null default false,
  answered boolean not null default false,
  reply text,
  answered_by uuid references profiles(id),
  created_at timestamp with time zone not null default now()
);

-- 7. RLS for anonymous_questions
alter table anonymous_questions enable row level security;

create policy "Anyone can view anonymous questions"
  on anonymous_questions for select
  using ( true );

create policy "Anyone can insert anonymous questions"
  on anonymous_questions for insert
  with check ( true );

create policy "Teachers can update answers"
  on anonymous_questions for update
  using ( exists ( select 1 from profiles where id = auth.uid() and role in ('teacher', 'admin') ) );

-- 8. Create index for performance
create index idx_anonymous_questions_answered on anonymous_questions(answered);
create index idx_anonymous_questions_created on anonymous_questions(created_at desc);

-- ═══════════════════════════════════════════════════════════════════════════
-- 9. Assignments table (teacher → lesson dispatch with join codes)
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists assignments (
  id uuid default gen_random_uuid() primary key,
  join_code text unique not null,
  teacher_id uuid references profiles(id),
  title text not null,
  lesson_content text not null,
  created_at timestamptz default now()
);

alter table assignments enable row level security;

drop policy if exists "Anyone can view assignments" on assignments;
create policy "Anyone can view assignments"
  on assignments for select
  to anon, authenticated
  using (true);

drop policy if exists "Authenticated users can create assignments" on assignments;
create policy "Authenticated users can create assignments"
  on assignments for insert
  to authenticated
  with check (auth.uid() is not null);

drop policy if exists "Teachers can update own assignments" on assignments;
create policy "Teachers can update own assignments"
  on assignments for update
  to authenticated
  using (teacher_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════
-- 10. Assignment submissions (student check-in / task completion)
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists assignment_submissions (
  id uuid default gen_random_uuid() primary key,
  assignment_id uuid references assignments(id) not null,
  student_name text not null,
  user_id uuid references auth.users(id),
  step1_reading boolean default false,
  step2_game_score int default 0,
  step2_completed boolean default false,
  step3_question text,
  step3_completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now()
);

alter table assignment_submissions enable row level security;

drop policy if exists "Anyone can view submissions" on assignment_submissions;
create policy "Anyone can view submissions"
  on assignment_submissions for select
  to anon, authenticated
  using (true);

drop policy if exists "Anyone can insert submissions" on assignment_submissions;
create policy "Anyone can insert submissions"
  on assignment_submissions for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Anyone can update submissions" on assignment_submissions;
create policy "Anyone can update submissions"
  on assignment_submissions for update
  to anon, authenticated
  using (true)
  with check (true);

-- Indexes
create index if not exists idx_assignments_join_code on assignments(join_code);
create index if not exists idx_submissions_assignment_id on assignment_submissions(assignment_id);
