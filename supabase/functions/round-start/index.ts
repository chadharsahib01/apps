import { adminClient, corsHeaders, logAudit } from "../_shared/security.ts";
import { randomHex, sha256Hex } from "../_shared/provablyFair.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = adminClient();

  const serverSeed = await randomHex(32);
  const serverSeedHash = await sha256Hex(serverSeed);
  const publicSalt = await randomHex(16);

  const { data: edgeConfig, error: edgeError } = await supabase
    .from("house_edge_configs")
    .select("version")
    .order("version", { ascending: false })
    .limit(1)
    .single();
  if (edgeError) return new Response(edgeError.message, { status: 400, headers: corsHeaders });

  const { data: lastRound } = await supabase.from("rounds").select("nonce").order("nonce", { ascending: false }).limit(1).maybeSingle();
  const nonce = (lastRound?.nonce ?? 0) + 1;

  const startsAt = new Date(Date.now() + 5_000).toISOString();
  const bettingClosesAt = new Date(Date.now() + 20_000).toISOString();

  const { data, error } = await supabase
    .from("rounds")
    .insert({
      nonce,
      status: "betting_open",
      server_seed_hash: serverSeedHash,
      public_salt: publicSalt,
      edge_config_version: edgeConfig.version,
      starts_at: startsAt,
      betting_closes_at: bettingClosesAt
    })
    .select("id, nonce, server_seed_hash")
    .single();

  if (error) return new Response(error.message, { status: 400, headers: corsHeaders });

  await supabase.from("audit_logs").insert({ action: "round_seed_committed", metadata: { round_id: data.id, nonce, server_seed } });
  await logAudit("round_started", null, { round_id: data.id, nonce });

  return Response.json(data, { headers: corsHeaders });
});
