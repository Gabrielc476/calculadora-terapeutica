-- ==============================================================================
-- SCHEMA SUPABASE: CALCULADORA TERAPÊUTICA
-- Execute este script no SQL Editor do seu projeto Supabase
-- ==============================================================================

-- 1. Tabela de Perfis / Configurações do Usuário
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  cutoff_day integer default 26 not null,
  psychology_default_rate numeric(10,2) default 30.00 not null,
  psychology_default_duration integer default 45 not null,
  at_hourly_rate numeric(10,2) default 25.00 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS em profiles
alter table public.profiles enable row level security;

create policy "Usuários podem visualizar seu próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuários podem atualizar seu próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Usuários podem inserir seu próprio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Trigger para criar perfil automaticamente ao cadastrar novo usuário
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. Tabela de Pacientes Fixos
create table if not exists public.patients (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  name text not null,
  default_role text check (default_role in ('psicologa', 'at')) default 'psicologa',
  default_duration integer default 45 not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS em patients
alter table public.patients enable row level security;

create policy "Usuários gerenciam apenas seus próprios pacientes"
  on public.patients for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_patients_user_id on public.patients(user_id);


-- 3. Tabela de Atendimentos / Sessões
create table if not exists public.attendances (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  patient_id uuid references public.patients(id) on delete set null,
  patient_name text not null,
  date date not null,
  role text check (role in ('psicologa', 'at')) not null,
  duration_minutes integer not null check (duration_minutes > 0),
  type text check (type in ('fixo', 'substituicao')) not null default 'fixo',
  calculated_value numeric(10,2) not null check (calculated_value >= 0),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS em attendances
alter table public.attendances enable row level security;

create policy "Usuários gerenciam apenas seus próprios atendimentos"
  on public.attendances for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_attendances_user_date on public.attendances(user_id, date);
create index if not exists idx_attendances_patient_id on public.attendances(patient_id);


-- 4. Tabela de Status de Pagamento dos Períodos
create table if not exists public.period_payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  period_key text not null, -- Exemplo: '2026-08-26_2026-09-25'
  start_date date not null,
  end_date date not null,
  is_paid boolean default false not null,
  paid_at date,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint uq_user_period unique (user_id, period_key)
);

-- Habilitar RLS em period_payments
alter table public.period_payments enable row level security;

create policy "Usuários gerenciam apenas seus próprios pagamentos de períodos"
  on public.period_payments for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_period_payments_user_key on public.period_payments(user_id, period_key);
