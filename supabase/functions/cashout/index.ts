import { adminClient, corsHeaders, requireUser, logAudit } from "../_shared/security.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });

  const user = await requireUser(req);
  const { betId, multiplier } = await req.json();

  const requestedAt = new Date().toISOString();
  const supabase = adminClient();
  const { data, error } = await supabase.rpc("fn_cashout_bet", {
    p_bet_id: betId,
    p_user_id: user.id,
    p_multiplier: multiplier,
    p_requested_at: requestedAt
  });

  if (error) return new Response(error.message, { status: 400, headers: corsHeaders });

  await logAudit("cashout_attempt", user.id, { betId, accepted: data });
  return Response.json({ accepted: !!data }, { headers: corsHeaders });
});
