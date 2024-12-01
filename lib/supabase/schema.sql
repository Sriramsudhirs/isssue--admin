-- Enable RLS
alter table auth.users enable row level security;

-- Create users table if it doesn't exist
create table if not exists public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  name text,
  role text not null check (role in ('ADMIN', 'USER')) default 'USER',
  credits integer not null default 10,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on users table
alter table public.users enable row level security;

-- Drop existing policies
drop policy if exists "Users can view their own data" on public.users;
drop policy if exists "Admins can view all users" on public.users;
drop policy if exists "Users can update their own data" on public.users;

-- Create updated policies
create policy "Users can view their own data"
  on public.users
  for select
  using (auth.uid() = id);

create policy "Users can update their own data"
  on public.users
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admins can manage all users"
  on public.users
  for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'ADMIN'
    )
  );

-- Create function to handle new user registration
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, role)
  values (new.id, new.email, 'USER');
  return new;
end;
$$;

-- Create trigger for new user registration
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Ensure proper indexes exist
create index if not exists users_role_idx on public.users(role);
create index if not exists users_email_idx on public.users(email);