import { adminClient, corsHeaders, requireUser, logAudit } from "../_shared/security.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });

  const user = await requireUser(req);
  const { edgeBps, minMultiplier, maxMultiplier, effectiveFromRound } = await req.json();

  const supabase = adminClient();
  const { data: profile } = await supabase.from("user_profiles").select("role, mfa_enabled").eq("id", user.id).single();
  if (!profile || !["admin", "security_admin"].includes(profile.role) || !profile.mfa_enabled) {
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  const { data: latest } = await supabase.from("house_edge_configs").select("version").order("version", { ascending: false }).limit(1).single();
  const version = (latest?.version ?? 0) + 1;

  const { data, error } = await supabase
    .from("house_edge_configs")
    .insert({
      version,
      edge_bps: edgeBps,
      min_multiplier: minMultiplier,
      max_multiplier: maxMultiplier,
      effective_from_round: effectiveFromRound,
      created_by: user.id
    })
    .select("version")
    .single();

  if (error) return new Response(error.message, { status: 400, headers: corsHeaders });
  await logAudit("house_edge_updated", user.id, { version, edgeBps, effectiveFromRound });

  return Response.json(data, { headers: corsHeaders });
});
