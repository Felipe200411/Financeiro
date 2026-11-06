create table if not exists public.financeiro_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.financeiro_data enable row level security;

create policy "Users can read their own financial data"
  on public.financeiro_data for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own financial data"
  on public.financeiro_data for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own financial data"
  on public.financeiro_data for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
