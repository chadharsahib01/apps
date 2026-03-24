# Edge Function Security Model

- All mutating operations run with service-role credentials.
- Client auth token is revalidated server-side (`requireUser`).
- Financial updates call SQL RPC functions that apply transaction locking.
- Public endpoint is read-only (`public-rounds`).
- Admin edge updates require role + MFA checks.
