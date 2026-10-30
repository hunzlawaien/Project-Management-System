import api from "./axios";

export async function getTasks() {
  const response = await api.get("/api/tasks");
  return response.data;
}

export async function createTask(taskData) {
  const response = await api.post("/api/tasks", taskData);
  return response.data;
}

export async function updateTask(id, taskData) {
  const response = await api.put(`/api/tasks/${id}`, taskData);
  return response.data;
}

export async function deleteTask(id) {
  const response = await api.delete(`/api/tasks/${id}`);
  return response.data;
}
