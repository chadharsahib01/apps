export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function randomHex(bytes = 32): Promise<string> {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return [...arr].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function crashFromSeeds(serverSeed: string, clientSeed: string, nonce: number, edgeBps: number): Promise<number> {
  const hash = await sha256Hex(`${serverSeed}:${clientSeed}:${nonce}`);
  const h = BigInt(`0x${hash.slice(0, 13)}`);
  const e = 2n ** 52n;
  const raw = Number((100n * e - h) / (e - h)) / 100;
  const edgeFactor = 1 - edgeBps / 10_000;
  return Math.max(1, Math.floor(raw * edgeFactor * 100) / 100);
}
