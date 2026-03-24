# Folder Structure

```text
.
├── frontend/
│   └── src/
│       ├── lib/
│       │   ├── api/
│       │   ├── components/
│       │   ├── stores/
│       │   └── types/
│       ├── routes/
│       └── styles/
├── supabase/
│   ├── migrations/
│   └── functions/
│       ├── _shared/
│       ├── round-start/
│       ├── place-bet/
│       ├── cashout/
│       ├── round-resolve/
│       ├── withdrawal-request/
│       ├── admin-update-edge/
│       └── public-rounds/
└── cloudflare/
```

## Service split

1. `round-*` functions represent the game engine service.
2. `place-bet`, `cashout`, and `withdrawal-request` are wallet/ledger service boundaries.
3. Chat/rain and anti-abuse scoring are intended as separate future functions/processes writing only to `audit_logs` and dedicated abuse tables.

## Real-time model

- Supabase Realtime publishes `rounds` and `bets` updates.
- Client treats updates as display-only; critical actions use edge functions + SQL RPC only.
- Event signatures (`outcome_signature`) allow tamper detection by clients.
