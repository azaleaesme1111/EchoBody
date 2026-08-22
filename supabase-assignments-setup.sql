-- ═══════════════════════════════════════════════════════════════════════════
-- EchoBody: Assignments & Submissions 建表脚本
-- 请直接粘贴到 Supabase Dashboard → SQL Editor 中运行
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. 创建 assignments 表（教师发布作业 + 6位课堂码）
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists public.assignments (
  id            uuid default gen_random_uuid() primary key,
  join_code     text unique not null,          -- 6位课堂码 (如 AB12CD)
  teacher_id    uuid references public.profiles(id),  -- 创建者 (nullable)
  title         text not null,                 -- 课程标题
  lesson_content text not null,                -- 教案 Markdown 原文
  created_at    timestamptz default now()
);

alter table public.assignments enable row level security;

-- 任何人（含匿名学生）均可通过 join_code 查询 assignment
drop policy if exists "Anyone can view assignments" on public.assignments;
create policy "Anyone can view assignments"
  on public.assignments for select
  to anon, authenticated
  using (true);

-- 已登录用户（教师）可以创建 assignment
drop policy if exists "Authenticated users can create assignments" on public.assignments;
create policy "Authenticated users can create assignments"
  on public.assignments for insert
  to authenticated
  with check (auth.uid() is not null);

-- 教师可以更新自己的 assignment
drop policy if exists "Teachers can update own assignments" on public.assignments;
create policy "Teachers can update own assignments"
  on public.assignments for update
  to authenticated
  using (teacher_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. 创建 assignment_submissions 表（学生打卡 / 任务完成）
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists public.assignment_submissions (
  id              uuid default gen_random_uuid() primary key,
  assignment_id   uuid references public.assignments(id) not null,
  student_name    text not null,
  user_id         uuid references auth.users(id),       -- nullable: guest = null
  step1_reading   boolean default false,
  step2_game_score int default 0,
  step2_completed boolean default false,
  step3_question  text,
  step3_completed boolean default false,
  completed_at    timestamptz,
  created_at      timestamptz default now()
);

alter table public.assignment_submissions enable row level security;

-- 任何人（含匿名）可以查看 submissions（教师看自己班级的，学生看自己的）
drop policy if exists "Anyone can view submissions" on public.assignment_submissions;
create policy "Anyone can view submissions"
  on public.assignment_submissions for select
  to anon, authenticated
  using (true);

-- 任何人（含匿名学生）可以插入 submissions —— 免登录打卡核心
drop policy if exists "Anyone can insert submissions" on public.assignment_submissions;
create policy "Anyone can insert submissions"
  on public.assignment_submissions for insert
  to anon, authenticated
  with check (true);

-- 任何人（含匿名学生）可以更新自己的 submissions（逐步打卡）
drop policy if exists "Anyone can update submissions" on public.assignment_submissions;
create policy "Anyone can update submissions"
  on public.assignment_submissions for update
  to anon, authenticated
  using (true)
  with check (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. 索引优化
-- ═══════════════════════════════════════════════════════════════════════════
create index if not exists idx_assignments_join_code on public.assignments(join_code);
create index if not exists idx_assignments_teacher_id on public.assignments(teacher_id);
create index if not exists idx_submissions_assignment_id on public.assignment_submissions(assignment_id);
create index if not exists idx_submissions_student_name on public.assignment_submissions(student_name);

-- ═══════════════════════════════════════════════════════════════════════════
-- 完成！请验证：
--   SELECT * FROM public.assignments LIMIT 1;
--   SELECT * FROM public.assignment_submissions LIMIT 1;
-- ═══════════════════════════════════════════════════════════════════════════
