const API_URL = import.meta.env.VITE_API_URL;

// 401 vachina refresh try cheyakudadu ee paths ki
const NO_REFRESH_PATHS = ["/auth/login", "/auth/refresh"];

// AuthContext ee function ni register chestundi (logout state kosam)
let onUnauthorized = null;

export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

// plain fetch, Response object return chestundi, logic emi ledu
function request(path, options = {}) {
  return fetch(API_URL + path, {
    credentials: "include",
    ...options, // options lets us include methods
  });
}

export async function refreshSession() {
  try {
    const res = await request("/auth/refresh", { method: "POST" });
    return res.ok;
  } catch {
    return false; // server down / network error
  }
}

export async function apiFetch(path, options = {}) {
  let res = await request(path, options);

  if (res.status === 401 && !NO_REFRESH_PATHS.includes(path)) {
    const refreshed = await refreshSession();
    if (refreshed) {
      res = await request(path, options); // okasari matrame retry
    } else if (onUnauthorized) {
      onUnauthorized();
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail = body?.detail;
    let message = "Request failed: " + res.status;
    if (typeof detail === "string") {
      message = detail;
    } else if (Array.isArray(detail) && detail.length > 0) {
      message = detail.map((d) => d.msg).join(". ");
    }

    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  if (res.status === 204) return null;

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
