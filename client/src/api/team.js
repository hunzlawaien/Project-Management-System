import api from "./axios";

export async function getTeamMembers() {
  const response = await api.get("/api/projects");

  const memberMap = new Map();

  response.data.forEach((project) => {
    project.members.forEach((member) => {
      if (!memberMap.has(member._id)) {
        memberMap.set(member._id, {
          ...member,
          projects: [],
        });
      }

      memberMap.get(member._id).projects.push({
        _id: project._id,
        name: project.name,
      });
    });
  });

  return Array.from(memberMap.values());
}
