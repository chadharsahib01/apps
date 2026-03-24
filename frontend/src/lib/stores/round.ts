import { writable } from "svelte/store";
import type { RoundPublic } from "$lib/types/game";

export const rounds = writable<RoundPublic[]>([]);
export const activeMultiplier = writable(1);
