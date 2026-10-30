import api from "./axios";

export async function getProfile() {
  const response = await api.get("/api/profile");
  return response.data;
}

export async function updateProfile(profileData) {
  const response = await api.put("/api/profile", profileData);
  return response.data;
}

export async function uploadProfilePicture(image) {
  const formData = new FormData();
  formData.append("profilePicture", image);

  const response = await api.post("/api/profile/picture", formData);
  return response.data;
}

export async function removeProfilePicture() {
  const response = await api.delete("/api/profile/picture");
  return response.data;
}

export async function deleteAccount(password) {
  const response = await api.delete("/api/profile/account", {
    data: { password },
  });

  return response.data;
}
