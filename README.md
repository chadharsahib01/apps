# Secure Crash Betting Platform (Supabase + SvelteKit)

Production-focused scaffold implementing a server-authoritative, provably fair Crash game with immutable ledgering, atomic wallet operations, anti-abuse controls, and auditable configuration.

## Architecture

- `frontend/`: SvelteKit + PixiJS + Tailwind (display only; no financial/game trust).
- `supabase/migrations/`: PostgreSQL schema, constraints, RLS, and helper procedures.
- `supabase/functions/`: Edge Functions implementing all sensitive workflows server-side.
- `cloudflare/`: Cloudflare Pages deployment config.

## Security invariants enforced

1. Financial state transitions only in Postgres transaction functions.
2. Wallet is derived from immutable ledger.
3. Crash result computed server-side from server seed + client seed + nonce.
4. Round hash committed before betting and seed revealed after settlement.
5. Admin cannot mutate active/upcoming committed crash outcomes.
6. Signed realtime payloads from server only.
