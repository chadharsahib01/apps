export type RoundPublic = {
  id: number;
  nonce: number;
  status: "scheduled" | "betting_open" | "in_progress" | "crashed" | "settled" | "cancelled";
  server_seed_hash: string;
  server_seed_reveal?: string | null;
  crash_multiplier?: number | null;
  starts_at: string;
  settled_at?: string | null;
};
