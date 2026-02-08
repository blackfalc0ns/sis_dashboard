const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export async function api<T>(
  endpoint: string,
  options: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  return res.json();
}

export async function apiWithToken<T>(
  endpoint: string,
  options: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return res.json();
}
