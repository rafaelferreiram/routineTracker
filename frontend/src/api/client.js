/**
 * API Client - all calls to the FastAPI backend
 */

const BASE = '/api';

export function getToken() {
  return localStorage.getItem('rq_token');
}

export async function apiCall(method, path, body) {
  const token = getToken();
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };

  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Request failed');
  return data;
}

export const api = {
  login: (username, password) =>
    apiCall('POST', '/auth/login', { username, password }),

  register: (username, password) =>
    apiCall('POST', '/auth/register', { username, password }),

  getData: () =>
    apiCall('GET', '/data'),

  saveData: (data) =>
    apiCall('PUT', '/data', { data }),
};
