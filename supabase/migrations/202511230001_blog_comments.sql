-- Create blog_comments table
create table if not exists public.blog_comments (
  id uuid not null default gen_random_uuid(),
  post_id uuid not null references public.blog_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint blog_comments_pkey primary key (id)
);

-- Add allow_comments to blog_posts
alter table public.blog_posts 
add column if not exists allow_comments boolean default true;

-- Enable RLS
alter table public.blog_comments enable row level security;

-- Policies for blog_comments
drop policy if exists "Comments are viewable by everyone" on public.blog_comments;
create policy "Comments are viewable by everyone"
  on public.blog_comments for select
  using (true);

drop policy if exists "Authenticated users can insert comments" on public.blog_comments;
create policy "Authenticated users can insert comments"
  on public.blog_comments for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "Users can update their own comments" on public.blog_comments;
create policy "Users can update their own comments"
  on public.blog_comments for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own comments" on public.blog_comments;
create policy "Users can delete their own comments"
  on public.blog_comments for delete
  using (auth.uid() = user_id);

-- Create index for performance
create index if not exists blog_comments_post_id_idx on public.blog_comments(post_id);
create index if not exists blog_comments_user_id_idx on public.blog_comments(user_id);
