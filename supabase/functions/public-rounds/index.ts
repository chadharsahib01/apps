import { adminClient, corsHeaders } from "../_shared/security.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = adminClient();
  const { data, error } = await supabase
    .from("rounds")
    .select("id, nonce, status, server_seed_hash, server_seed_reveal, crash_multiplier, starts_at, settled_at")
    .order("id", { ascending: false })
    .limit(50);

  if (error) return new Response(error.message, { status: 500, headers: corsHeaders });
  return Response.json({ rounds: data }, { headers: corsHeaders });
});
