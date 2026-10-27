import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const projectsApi = axios.create({
  baseURL: `${API_URL}/api/projects`,
});

export async function getProjects() {
  const response = await projectsApi.get("/");
  return response.data;
}

export async function createProject(projectData) {
  const response = await projectsApi.post("/", projectData);
  return response.data;
}

export async function updateProject(id, projectData) {
  const response = await projectsApi.put(`/${id}`, projectData);
  return response.data;
}

export async function deleteProject(id) {
  const response = await projectsApi.delete(`/${id}`);
  return response.data;
}
