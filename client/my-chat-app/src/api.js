import axios from "axios";

export const API_BASE_URL = "https://chatee-application.onrender.com";

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getAssetUrl = (value) => {
  if (!value) return "";
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  return new URL(value, API_BASE_URL).toString();
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
