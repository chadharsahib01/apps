import { adminClient, corsHeaders, requireUser, logAudit } from "../_shared/security.ts";

const LARGE_WITHDRAWAL = 1000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });

  const user = await requireUser(req);
  const { amount, destination, asset } = await req.json();

  const supabase = adminClient();
  const { data: profile } = await supabase.from("user_profiles").select("kyc_status").eq("id", user.id).single();
  if (amount >= LARGE_WITHDRAWAL && profile?.kyc_status !== "approved") {
    return new Response("KYC required", { status: 403, headers: corsHeaders });
  }

  const { data: balanceRows } = await supabase.from("wallet_balances").select("balance").eq("user_id", user.id).single();
  const balance = Number(balanceRows?.balance ?? 0);
  if (balance < amount) return new Response("Insufficient funds", { status: 400, headers: corsHeaders });

  const status = amount >= LARGE_WITHDRAWAL ? "under_review" : "queued";
  const { data, error } = await supabase.from("withdrawals").insert({ user_id: user.id, amount, destination, asset, status }).select("id, status").single();
  if (error) return new Response(error.message, { status: 400, headers: corsHeaders });

  await supabase.from("wallet_ledger").insert({
    user_id: user.id,
    amount: -Number(amount),
    type: "withdrawal_hold",
    reference_table: "withdrawals",
    reference_id: String(data.id)
  });

  await logAudit("withdrawal_requested", user.id, { withdrawalId: data.id, amount, status });
  return Response.json(data, { headers: corsHeaders });
});
