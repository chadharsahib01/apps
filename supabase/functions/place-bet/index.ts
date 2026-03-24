import { adminClient, corsHeaders, requireUser } from "../_shared/security.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });

  const user = await requireUser(req);
  const { roundId, amount, clientSeed, autoCashout } = await req.json();

  const supabase = adminClient();
  const { data, error } = await supabase.rpc("fn_place_bet", {
    p_round_id: roundId,
    p_user_id: user.id,
    p_amount: amount,
    p_client_seed: clientSeed,
    p_auto_cashout: autoCashout ?? null
  });

  if (error) return new Response(error.message, { status: 400, headers: corsHeaders });
  return Response.json({ betId: data }, { headers: corsHeaders });
});
