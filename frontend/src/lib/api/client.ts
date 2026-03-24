const BASE = import.meta.env.PUBLIC_SUPABASE_FUNCTIONS_URL;

export async function postSecure(path: string, token: string, body: unknown) {
  const res = await fetch(`${BASE}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getPublic(path: string) {
  const res = await fetch(`${BASE}/${path}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
