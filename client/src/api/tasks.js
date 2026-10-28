import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const tasksApi = axios.create({
  baseURL: `${API_URL}/api/tasks`,
});

export async function getTasks() {
  const response = await tasksApi.get("/");
  return response.data;
}

export async function createTask(taskData) {
  const response = await tasksApi.post("/", taskData);
  return response.data;
}

export async function updateTask(id, taskData) {
  const response = await tasksApi.put(`/${id}`, taskData);
  return response.data;
}

export async function deleteTask(id) {
  const response = await tasksApi.delete(`/${id}`);
  return response.data;
}
