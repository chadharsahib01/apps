import { getPublic } from "$lib/api/client";

export const ssr = true;

export async function load() {
  const { rounds } = await getPublic("public-rounds");
  return { rounds };
}
