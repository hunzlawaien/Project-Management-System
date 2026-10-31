import { useEffect, useState } from "react";
import { Search, Users, Mail, FolderKanban } from "lucide-react";
import { getTeamMembers } from "../api/team";

function Team() {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadMembers() {
    try {
      setError("");

      const data = await getTeamMembers();
      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not load project collaborators.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMembers();
  }, []);

  function getInitials(name) {
    return (name || "?")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }

  const searchText = search.trim().toLowerCase();

  const filteredMembers = members.filter((member) => {
    const matchesName = (member.name || "").toLowerCase().includes(searchText);

    const matchesEmail = (member.email || "")
      .toLowerCase()
      .includes(searchText);

    const matchesProject = (member.projects || []).some((project) =>
      (project.name || "").toLowerCase().includes(searchText),
    );

    return matchesName || matchesEmail || matchesProject;
  });

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950 sm:p-6">
        {/* Page heading */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              My Team
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              View collaborators working across your projects.
            </p>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {members.length}{" "}
              {members.length === 1 ? "collaborator" : "collaborators"}
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
          >
            {error}

            <button
              type="button"
              onClick={loadMembers}
              className="ml-2 font-medium underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Search */}
        <div className="relative mt-6 max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search collaborators or projects..."
            aria-label="Search collaborators"
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </div>

        {/* Loading state */}
        {loading ? (
          <p className="py-12 text-center text-sm text-gray-500">
            Loading collaborators...
          </p>
        ) : filteredMembers.length === 0 ? (
          /* Empty state */
          <div className="py-12 text-center">
            <Users size={32} className="mx-auto mb-3 text-gray-400" />

            <p className="font-medium text-gray-900 dark:text-white">
              {searchText ? "No collaborators found" : "No collaborators yet"}
            </p>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchText
                ? "Try searching with another name, email, or project."
                : "Add members to your projects to see them here."}
            </p>
          </div>
        ) : (
          /* Collaborator cards */
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredMembers.map((member) => (
              <article
                key={member._id}
                className="rounded-xl border border-gray-200 p-5 dark:border-gray-800"
              >
                {/* Collaborator information */}
                <div className="flex items-center gap-3">
                  {member.profilePicture ? (
                    <img
                      src={member.profilePicture}
                      alt={member.name || "Profile"}
                      className="h-12 w-12 shrink-0 rounded-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                        event.currentTarget.nextElementSibling.style.display =
                          "flex";
                      }}
                    />
                  ) : null}

                  <div
                    className={`h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 ${
                      member.profilePicture ? "hidden" : "flex"
                    }`}
                  >
                    {getInitials(member.name)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium text-gray-900 dark:text-white">
                      {member.name || "Unnamed User"}
                    </h3>

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {member.projects?.length || 0}{" "}
                      {(member.projects?.length || 0) === 1
                        ? "Project"
                        : "Projects"}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="mt-5 flex items-center gap-2 border-t border-gray-100 pt-4 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <Mail size={16} className="shrink-0" />
                  <span className="truncate">{member.email}</span>
                </div>

                {/* Associated projects */}
                <div className="mt-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <FolderKanban size={16} />
                    <span>Projects</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {member.projects?.length > 0 ? (
                      member.projects.map((project) => (
                        <span
                          key={project._id}
                          className="rounded-md bg-gray-100 px-2.5 py-1.5 text-xs text-gray-600 dark:bg-gray-900 dark:text-gray-300"
                        >
                          {project.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500">
                        No projects assigned
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Team;
