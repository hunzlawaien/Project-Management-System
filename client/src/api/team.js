import api from "./axios";

export async function getTeamMembers() {
  const response = await api.get("/api/team");
  return response.data;
}

export async function addTeamMember(email) {
  const response = await api.post("/api/team", { email });
  return response.data;
}

export async function removeTeamMember(userId) {
  const response = await api.delete(`/api/team/${userId}`);
  return response.data;
}
