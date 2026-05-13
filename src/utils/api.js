// src/utils/api.js
// Simple wrapper for the backend API (http://localhost:3001)

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function register(username, email, password) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  const data = await res.json();
  if (data.token) localStorage.setItem("token", data.token);
  return data;
}

export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (data.token) localStorage.setItem("token", data.token);
  return data;
}

export async function getProjects() {
  const res = await fetch(`${BASE_URL}/projects`, {
    method: "GET",
    headers: { ...getAuthHeaders() },
  });
  return await res.json();
}

export async function saveProject(name, data) {
  const res = await fetch(`${BASE_URL}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ name, data }),
  });
  return await res.json();
}

export async function updateProject(id, name, data) {
  const res = await fetch(`${BASE_URL}/projects/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ name, data }),
  });
  return await res.json();
}

export async function deleteProject(id) {
  const res = await fetch(`${BASE_URL}/projects/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });
  return await res.json();
}
