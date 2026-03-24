<script lang="ts">
  import CrashCanvas from "$lib/components/CrashCanvas.svelte";
  export let data;
  const latest = data.rounds?.[0];
  const displayMultiplier = latest?.crash_multiplier ?? 1;
</script>

<svelte:head>
  <title>Secure Crash | Provably Fair Multiplayer</title>
  <meta name="description" content="Real-time provably fair crash betting with server-authoritative settlement" />
</svelte:head>

<main class="min-h-screen bg-[var(--bg)] text-[var(--fg)] p-6">
  <section class="mx-auto max-w-5xl space-y-6">
    <h1 class="text-3xl font-bold">Provably Fair Crash</h1>
    <p class="text-sm text-slate-300">Round hash commits are shown before each game. Seed reveal appears after settlement for independent verification.</p>

    <CrashCanvas multiplier={displayMultiplier} />

    <div class="rounded-xl border border-slate-700 p-4">
      <h2 class="text-xl font-semibold">Latest Round</h2>
      <ul class="mt-2 text-sm space-y-1">
        <li>ID: {latest?.id}</li>
        <li>Nonce: {latest?.nonce}</li>
        <li>Status: {latest?.status}</li>
        <li>Committed Hash: {latest?.server_seed_hash}</li>
        <li>Crash: {latest?.crash_multiplier ?? "pending"}</li>
      </ul>
    </div>
  </section>
</main>
