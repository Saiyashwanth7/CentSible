const API_URL = import.meta.env.VITE_API_URL;

export async function apiFetch(path, options = {}) {
  const res = await fetch(API_URL + path, {
    credentials: "include",
    ...options, // options lets us include methods
  });

  if (!res.ok) {
    throw new Error("Request failed: " + res.status);
  }

  return res.json();
}
