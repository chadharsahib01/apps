import { adminClient, corsHeaders, logAudit } from "../_shared/security.ts";
import { crashFromSeeds } from "../_shared/provablyFair.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });

  const { roundId } = await req.json();
  const supabase = adminClient();

  const { data: round, error } = await supabase
    .from("rounds")
    .select("id, nonce, status, edge_config_version")
    .eq("id", roundId)
    .single();
  if (error) return new Response(error.message, { status: 404, headers: corsHeaders });
  if (!["betting_open", "in_progress"].includes(round.status)) return new Response("invalid state", { status: 409, headers: corsHeaders });

  const { data: auditSeed } = await supabase
    .from("audit_logs")
    .select("metadata")
    .eq("action", "round_seed_committed")
    .contains("metadata", { round_id: roundId })
    .order("id", { ascending: false })
    .limit(1)
    .single();
  const serverSeed = auditSeed?.metadata?.server_seed;
  if (!serverSeed) return new Response("seed missing", { status: 500, headers: corsHeaders });

  const { data: edge } = await supabase.from("house_edge_configs").select("edge_bps").eq("version", round.edge_config_version).single();
  const crash = await crashFromSeeds(serverSeed, "public-client-seed", round.nonce, edge?.edge_bps ?? 100);

  const { error: updateError } = await supabase
    .from("rounds")
    .update({ status: "crashed", crash_multiplier: crash, server_seed_reveal: serverSeed, settled_at: new Date().toISOString() })
    .eq("id", roundId)
    .in("status", ["betting_open", "in_progress"]);

  if (updateError) return new Response(updateError.message, { status: 400, headers: corsHeaders });

  await supabase.rpc("fn_resolve_round_losses", { p_round_id: roundId });
  await supabase.from("rounds").update({ status: "settled" }).eq("id", roundId).eq("status", "crashed");
  await logAudit("round_settled", null, { roundId, crash });

  return Response.json({ roundId, crash, serverSeed }, { headers: corsHeaders });
});
