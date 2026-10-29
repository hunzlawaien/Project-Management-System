import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const teamAPI = axios.create({
  baseURL: `${API_URL}/api/team`,
});

export const getTeamMembers = async () => {
  const response = await teamAPI.get("/");
  return response.data;
};

export const createTeamMember = async (memberData) => {
  const response = await teamAPI.post("/", memberData);
  return response.data;
};

export const updateTeamMember = async (id, memberData) => {
  const response = await teamAPI.put(`/${id}`, memberData);
  return response.data;
};

export const deleteTeamMember = async (id) => {
  const response = await teamAPI.delete(`/${id}`);
  return response.data;
};
