import api from "./axios";

export async function getProjects() {
  const response = await api.get("/api/projects");
  return response.data;
}

export async function createProject(projectData) {
  const response = await api.post("/api/projects", projectData);
  return response.data;
}

export async function updateProject(id, projectData) {
  const response = await api.put(`/api/projects/${id}`, projectData);
  return response.data;
}

export async function deleteProject(id) {
  const response = await api.delete(`/api/projects/${id}`);
  return response.data;
}

export async function addProjectMember(projectId, email) {
  const response = await api.post(`/api/projects/${projectId}/members`, {
    email,
  });

  return response.data;
}
