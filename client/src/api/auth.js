import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const authAPI = axios.create({
  baseURL: `${API_URL}/api/auth`,
});

export async function registerUser(userData) {
  const response = await authAPI.post("/register", userData);
  return response.data;
}

export async function loginUser(userData) {
  const response = await authAPI.post("/login", userData);
  return response.data;
}

export async function changePassword(passwordData) {
  const token = localStorage.getItem("token");

  const response = await authAPI.put("/change-password", passwordData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}
