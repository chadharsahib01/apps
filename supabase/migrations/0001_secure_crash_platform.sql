-- Extensions
create extension if not exists pgcrypto;
create extension if not exists pgjwt;

create type app_role as enum ('user', 'support', 'admin', 'security_admin');
create type round_status as enum ('scheduled', 'betting_open', 'in_progress', 'crashed', 'settled', 'cancelled');
create type ledger_type as enum ('deposit', 'bet_hold', 'bet_refund', 'cashout_win', 'loss', 'withdrawal_hold', 'withdrawal_release', 'withdrawal_cancel', 'bonus_credit', 'bonus_revoke');
create type withdrawal_status as enum ('queued', 'under_review', 'approved', 'broadcasted', 'completed', 'rejected', 'cancelled');

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role app_role not null default 'user',
  mfa_enabled boolean not null default false,
  last_ip inet,
  kyc_status text not null default 'none',
  risk_score numeric(6,3) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.house_edge_configs (
  id bigserial primary key,
  version integer not null unique,
  edge_bps integer not null check (edge_bps between 10 and 500),
  min_multiplier numeric(8,4) not null default 1.00,
  max_multiplier numeric(12,6) not null default 1000.00,
  effective_from_round bigint,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  constraint edge_bounds check (min_multiplier >= 1 and max_multiplier > min_multiplier)
);

create table if not exists public.rounds (
  id bigint generated always as identity primary key,
  nonce bigint not null unique,
  status round_status not null default 'scheduled',
  server_seed_hash text not null,
  server_seed_reveal text,
  public_salt text not null,
  edge_config_version integer not null references public.house_edge_configs(version),
  starts_at timestamptz not null,
  betting_closes_at timestamptz not null,
  crash_multiplier numeric(14,6),
  outcome_signature text,
  created_at timestamptz not null default now(),
  settled_at timestamptz
);

create table if not exists public.bets (
  id bigint generated always as identity primary key,
  round_id bigint not null references public.rounds(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  amount numeric(20,8) not null check (amount > 0),
  client_seed text not null,
  requested_auto_cashout numeric(14,6) check (requested_auto_cashout is null or requested_auto_cashout >= 1.01),
  settled_multiplier numeric(14,6),
  result text not null default 'pending' check (result in ('pending','won','lost','void')),
  cashout_requested_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.wallet_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete restrict,
  amount numeric(20,8) not null,
  type ledger_type not null,
  reference_table text,
  reference_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint nonzero_amount check (amount <> 0)
);

create view public.wallet_balances as
select user_id, coalesce(sum(amount),0)::numeric(20,8) as balance
from public.wallet_ledger
group by user_id;

create table if not exists public.withdrawals (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete restrict,
  amount numeric(20,8) not null check (amount > 0),
  destination text not null,
  asset text not null,
  status withdrawal_status not null default 'queued',
  blockchain_txid text,
  risk_flags jsonb not null default '[]'::jsonb,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  action text not null,
  actor_user_id uuid references auth.users(id),
  target_user_id uuid references auth.users(id),
  ip inet,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;
alter table public.rounds enable row level security;
alter table public.bets enable row level security;
alter table public.wallet_ledger enable row level security;
alter table public.withdrawals enable row level security;
alter table public.audit_logs enable row level security;

create policy rounds_public_read on public.rounds for select using (true);
create policy bets_self_read on public.bets for select using (auth.uid() = user_id);
create policy ledger_self_read on public.wallet_ledger for select using (auth.uid() = user_id);
create policy withdrawals_self_read on public.withdrawals for select using (auth.uid() = user_id);

create or replace function public.get_balance_for_update(p_user_id uuid)
returns numeric language plpgsql security definer as $$
declare v_balance numeric(20,8);
begin
  perform pg_advisory_xact_lock(hashtext(p_user_id::text));
  select coalesce(sum(amount),0) into v_balance from public.wallet_ledger where user_id = p_user_id;
  return v_balance;
end $$;

create or replace function public.fn_place_bet(
  p_round_id bigint,
  p_user_id uuid,
  p_amount numeric,
  p_client_seed text,
  p_auto_cashout numeric
) returns bigint language plpgsql security definer as $$
declare
  v_bet_id bigint;
  v_balance numeric(20,8);
  v_status round_status;
begin
  select status into v_status from public.rounds where id = p_round_id for update;
  if v_status <> 'betting_open' then raise exception 'betting closed'; end if;

  v_balance := public.get_balance_for_update(p_user_id);
  if v_balance < p_amount then raise exception 'insufficient funds'; end if;

  insert into public.bets(round_id, user_id, amount, client_seed, requested_auto_cashout)
  values (p_round_id, p_user_id, p_amount, p_client_seed, p_auto_cashout)
  returning id into v_bet_id;

  insert into public.wallet_ledger(user_id, amount, type, reference_table, reference_id, metadata)
  values (p_user_id, -p_amount, 'bet_hold', 'bets', v_bet_id::text, jsonb_build_object('round_id', p_round_id));

  insert into public.audit_logs(action, actor_user_id, target_user_id, metadata)
  values ('bet_placed', p_user_id, p_user_id, jsonb_build_object('round_id', p_round_id, 'bet_id', v_bet_id));

  return v_bet_id;
end $$;

create or replace function public.fn_cashout_bet(
  p_bet_id bigint,
  p_user_id uuid,
  p_multiplier numeric,
  p_requested_at timestamptz
) returns boolean language plpgsql security definer as $$
declare
  v_round_id bigint;
  v_amount numeric;
  v_crash numeric;
  v_result text;
begin
  select round_id, amount, result into v_round_id, v_amount, v_result
  from public.bets where id = p_bet_id and user_id = p_user_id
  for update;

  if not found or v_result <> 'pending' then return false; end if;

  select crash_multiplier into v_crash from public.rounds where id = v_round_id for update;
  if v_crash is null or p_multiplier >= v_crash then
    update public.bets set result = 'lost', settled_multiplier = coalesce(settled_multiplier, v_crash) where id = p_bet_id and result = 'pending';
    return false;
  end if;

  update public.bets set result = 'won', settled_multiplier = p_multiplier, cashout_requested_at = p_requested_at
  where id = p_bet_id and result = 'pending';

  if found then
    insert into public.wallet_ledger(user_id, amount, type, reference_table, reference_id, metadata)
    values (p_user_id, round(v_amount * p_multiplier, 8), 'cashout_win', 'bets', p_bet_id::text, jsonb_build_object('multiplier', p_multiplier));
  end if;

  return found;
end $$;

create or replace function public.prevent_mutation() returns trigger language plpgsql as $$
begin
  raise exception 'immutable table';
end $$;

create trigger audit_logs_no_update before update or delete on public.audit_logs for each row execute function public.prevent_mutation();
create trigger wallet_ledger_no_update before update or delete on public.wallet_ledger for each row execute function public.prevent_mutation();
