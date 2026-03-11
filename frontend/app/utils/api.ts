import Constants from "expo-constants";

const backendUrl =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL ||
  process.env.EXPO_PUBLIC_BACKEND_URL;

export const API_BASE = backendUrl ? `${backendUrl}/api` : "";

export async function apiGet(path) {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error("Request failed");
  }
  return response.json();
}

export async function apiSend(path, method, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    throw new Error("Request failed");
  }
  return response.json();
}