const normalizeApiBaseUrl = (value) => {
  const base = value || "http://localhost:5000/api";
  const trimmed = base.replace(/\/$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
};

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
const API_ROOT_URL = API_BASE_URL.replace(/\/api\/?$/, "");
const TOKEN_KEY = "admin_access_token";
const LEGACY_STORAGE = localStorage;
const SESSION_STORAGE = sessionStorage;

export const tokenStore = {
  get: () => {
    // Enforce login on fresh browser sessions by reading token from sessionStorage only.
    const sessionToken = SESSION_STORAGE.getItem(TOKEN_KEY);
    if (sessionToken) return sessionToken;
    // Remove any old persisted token from previous versions.
    if (LEGACY_STORAGE.getItem(TOKEN_KEY)) {
      LEGACY_STORAGE.removeItem(TOKEN_KEY);
    }
    return null;
  },
  set: (token) => SESSION_STORAGE.setItem(TOKEN_KEY, token),
  clear: () => {
    SESSION_STORAGE.removeItem(TOKEN_KEY);
    LEGACY_STORAGE.removeItem(TOKEN_KEY);
  },
};

const request = async (path, options = {}) => {
  const token = tokenStore.get();
  const headers = { ...(options.headers || {}) };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  let payload = {};
  try {
    payload = await response.json();
  } catch (error) {
    payload = {};
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      tokenStore.clear();
    }
    const err = new Error(payload.message || "Request failed");
    err.status = response.status;
    err.payload = payload;
    throw err;
  }

  return payload;
};

const requestLegacy = async (url, options = {}) => {
  const token = tokenStore.get();
  const headers = { ...(options.headers || {}) };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let payload = {};
  try {
    payload = await response.json();
  } catch (error) {
    payload = {};
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      tokenStore.clear();
    }
    const err = new Error(payload.message || "Request failed");
    err.status = response.status;
    throw err;
  }

  return payload;
};

const requestWithFallback = async (attempts) => {
  let lastError;
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
      if (error.status && error.status !== 404) {
        throw error;
      }
    }
  }
  throw lastError || new Error("Request failed");
};

export const api = {
  login: (email, password) =>
    requestWithFallback([
      () =>
        request("/auth/admin/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        }),
      () =>
        requestLegacy(`${API_ROOT_URL}/admin/login`, {
          method: "POST",
          body: JSON.stringify({ email, password }),
        }),
    ]),
  signup: (name, email, password) =>
    request("/auth/admin/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),
  resendVerification: (email) =>
    request("/auth/admin/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  verifyLogin: (email, code) =>
    request("/auth/admin/verify-login", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    }),
  forgotPassword: (email) => request("/auth/admin/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  }),
  resetPassword: (email, token, newPassword) => request("/auth/admin/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, token, newPassword }),
  }),
  getAdmins: () => request("/auth/admins"),
  deleteAdmin: (id) => request(`/auth/admins/${id}`, { method: "DELETE" }),

  getUsers: () =>
    requestWithFallback([
      () => request("/users"),
      () => requestLegacy(`${API_ROOT_URL}/admin/users`),
    ]),
  createUser: (body) =>
    requestWithFallback([
      () => request("/users", { method: "POST", body: JSON.stringify(body) }),
      () => requestLegacy(`${API_ROOT_URL}/admin/users`, { method: "POST", body: JSON.stringify(body) }),
    ]),
  updateUser: (id, body) =>
    requestWithFallback([
      () => request(`/users/${id}`, { method: "PUT", body: JSON.stringify(body) }),
      () => requestLegacy(`${API_ROOT_URL}/admin/users/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    ]),
  deleteUser: (id) =>
    requestWithFallback([
      () => request(`/users/${id}`, { method: "DELETE" }),
      () => requestLegacy(`${API_ROOT_URL}/admin/users/${id}`, { method: "DELETE" }),
    ]),

  getVisitors: () => request("/visitors"),
  deleteVisitor: (id) => request(`/visitors/${id}`, { method: "DELETE" }),

  getProducts: () =>
    requestWithFallback([
      () => request("/products"),
      () => requestLegacy(`${API_ROOT_URL}/products`),
    ]),
  createProduct: (formData) =>
    requestWithFallback([
      () => request("/products", { method: "POST", body: formData }),
      () => requestLegacy(`${API_ROOT_URL}/products`, { method: "POST", body: formData }),
    ]),
  updateProduct: (id, formData) =>
    requestWithFallback([
      () => request(`/products/${id}`, { method: "PUT", body: formData }),
      () => requestLegacy(`${API_ROOT_URL}/products/${id}`, { method: "PUT", body: formData }),
    ]),
  deleteProduct: (id) =>
    requestWithFallback([
      () => request(`/products/${id}`, { method: "DELETE" }),
      () => requestLegacy(`${API_ROOT_URL}/products/${id}`, { method: "DELETE" }),
    ]),

  getContent: () =>
    requestWithFallback([
      () => request("/content"),
      () => requestLegacy(`${API_ROOT_URL}/content`),
    ]),
  createContent: (body) =>
    requestWithFallback([
      () => request("/content", { method: "POST", body: JSON.stringify(body) }),
      () => requestLegacy(`${API_ROOT_URL}/content`, { method: "POST", body: JSON.stringify(body) }),
    ]),
  updateContent: (id, body) =>
    requestWithFallback([
      () => request(`/content/${id}`, { method: "PUT", body: JSON.stringify(body) }),
      () => requestLegacy(`${API_ROOT_URL}/content/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    ]),
  deleteContent: (id) =>
    requestWithFallback([
      () => request(`/content/${id}`, { method: "DELETE" }),
      () => requestLegacy(`${API_ROOT_URL}/content/${id}`, { method: "DELETE" }),
    ]),

  getMedia: () => request("/media"),
  uploadMedia: (formData) => request("/media/upload", { method: "POST", body: formData }),
  getLeads: () => request("/contact/leads"),
  getAnalyticsOverview: () => request("/analytics/overview"),
  testEmail: (body) => request("/contact/test", { method: "POST", body: JSON.stringify(body) }),
};

export default API_BASE_URL;
