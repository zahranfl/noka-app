// src/api.js
export const backendUrl = import.meta.env.VITE_BACKEND_URL;

export async function apiFetch(path, options = {}) {
  const response = await fetch(`${backendUrl}${path}`, {
    credentials: "include",
    ...options,
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err}`);
  }
  return response.json();
}