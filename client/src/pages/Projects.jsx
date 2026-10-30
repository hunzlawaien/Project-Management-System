import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  CalendarDays,
  Users,
  RefreshCw,
} from "lucide-react";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../api/projects";

const emptyForm = {
  name: "",
  description: "",
  status: "Planning",
  progress: 0,
  deadline: "",
};

function formatDate(value) {
  if (!value) return "No deadline";
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getMemberNames(members) {
  if (!Array.isArray(members)) return [];

  return members.map((member) => {
    if (typeof member === "string") return member;
    return member?.name || "Unknown member";
  });
}

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  async function loadProjects() {
    try {
      setError("");
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load projects.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  function openCreateForm() {
    setEditingProject(null);
    setFormData(emptyForm);
    setError("");
    setShowForm(true);
  }

  function openEditForm(project) {
    setEditingProject(project);
    setFormData({
      name: project.name || "",
      description: project.description || "",
      status: project.status || "Planning",
      progress: project.progress ?? 0,
      deadline: project.deadline
        ? new Date(project.deadline).toISOString().slice(0, 10)
        : "",
    });
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingProject(null);
    setFormData(emptyForm);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: name === "progress" ? Number(value) : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        ...formData,
        progress:
          formData.status === "Completed"
            ? 100
            : formData.status === "Planning"
              ? 0
              : Number(formData.progress),
      };

      if (editingProject) {
        await updateProject(editingProject._id, payload);
      } else {
        await createProject(payload);
      }

      closeForm();
      await loadProjects();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save the project.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(project) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${project.name}"?`,
    );

    if (!confirmed) return;

    try {
      setError("");
      await deleteProject(project._id);
      setProjects((previous) =>
        previous.filter((item) => item._id !== project._id),
      );
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete the project.");
    }
  }

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name?.toLowerCase().includes(search.toLowerCase()) ||
      project.description?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || project.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusClasses = {
    Planning: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    "In Progress":
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    Completed:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Projects
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Projects you own or collaborate on.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus size={18} />
          New Project
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search projects..."
            aria-label="Search projects"
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter by project status"
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
        >
          <option>All</option>
          <option>Planning</option>
          <option>In Progress</option>
          <option>Completed</option>
        </select>

        <button
          type="button"
          onClick={loadProjects}
          title="Refresh projects"
          aria-label="Refresh projects"
          className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-3 py-2.5 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-gray-500">
          Loading projects...
        </p>
      ) : filteredProjects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-white">
            {search || statusFilter !== "All"
              ? "No matching projects"
              : "No projects yet"}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create a project or change your filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => {
            const names = getMemberNames(project.members);
            const progress =
              project.status === "Completed"
                ? 100
                : project.status === "Planning"
                  ? 0
                  : Number(project.progress || 0);

            return (
              <article
                key={project._id}
                className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="break-words font-semibold text-gray-900 dark:text-white">
                      {project.name}
                    </h3>
                    <span
                      className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        statusClasses[project.status] || statusClasses.Planning
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>

                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => openEditForm(project)}
                      aria-label={`Edit ${project.name}`}
                      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(project)}
                      aria-label={`Delete ${project.name}`}
                      className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <p className="mt-4 min-h-10 text-sm leading-6 text-gray-600 dark:text-gray-400">
                  {project.description}
                </p>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      Progress
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {progress}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <CalendarDays size={16} />
                  <span>Due {formatDate(project.deadline)}</span>
                </div>

                <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-800">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Users size={16} />
                    Collaborators
                  </div>

                  {names.length ? (
                    <div className="flex flex-wrap gap-2">
                      {names.map((name, index) => (
                        <span
                          key={`${project._id}-${index}`}
                          className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No collaborators yet.
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-form-title"
            className="my-auto w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-950"
          >
            <h2
              id="project-form-title"
              className="mb-5 text-lg font-semibold text-gray-900 dark:text-white"
            >
              {editingProject ? "Edit Project" : "Create Project"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="project-name"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Project Name
                </label>
                <input
                  id="project-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  maxLength={100}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="project-description"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Description
                </label>
                <textarea
                  id="project-description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  maxLength={500}
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="project-status"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Status
                </label>
                <select
                  id="project-status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option>Planning</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                </select>
              </div>

              {formData.status === "In Progress" && (
                <div>
                  <label
                    htmlFor="project-progress"
                    className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Progress (1–99%)
                  </label>
                  <input
                    id="project-progress"
                    name="progress"
                    type="number"
                    min="1"
                    max="99"
                    value={formData.progress}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="project-deadline"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Deadline
                </label>
                <input
                  id="project-deadline"
                  name="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingProject
                      ? "Save Changes"
                      : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Projects;
