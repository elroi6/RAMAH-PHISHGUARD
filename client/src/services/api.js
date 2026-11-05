import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api/v1",
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const checkBackendHealth = async () => {
  const response = await api.get("/health");
  return response.data;
};

export const scanUrl = async (url) => {
  const response = await api.post("/scans", { url });
  return response.data;
};

export const getMyScans = async (page = 1, limit = 10) => {
  const response = await api.get("/scans/mine", {
    params: { page, limit },
  });

  return response.data;
};
export default api;