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
