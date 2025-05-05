-- Create equity_grants table
create table public.equity_grants (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  company_name text not null,
  grant_date date not null,
  grant_type text not null check (grant_type in ('ISO', 'NSO', 'RSU')),
  shares integer not null check (shares > 0),
  strike_price numeric(10,2) not null check (strike_price >= 0),
  vesting_start_date date not null,
  vesting_cliff_date date not null,
  vesting_end_date date not null,
  vesting_schedule text not null check (vesting_schedule in ('monthly', 'quarterly', 'yearly')),
  current_fmv numeric(10,2) not null check (current_fmv >= 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.equity_grants enable row level security;

-- Create policy to allow users to see only their own grants
create policy "Users can view own equity grants"
  on public.equity_grants for select
  using (auth.uid() = user_id);

-- Create policy to allow users to insert their own grants
create policy "Users can insert own equity grants"
  on public.equity_grants for insert
  with check (auth.uid() = user_id);

-- Create policy to allow users to update their own grants
create policy "Users can update own equity grants"
  on public.equity_grants for update
  using (auth.uid() = user_id);

-- Create policy to allow users to delete their own grants
create policy "Users can delete own equity grants"
  on public.equity_grants for delete
  using (auth.uid() = user_id);

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_equity_grants_updated_at
  before update on public.equity_grants
  for each row
  execute function public.handle_updated_at();
