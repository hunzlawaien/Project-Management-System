import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  FolderKanban,
  CalendarDays,
  Users,
  Pencil,
  X,
  LoaderCircle,
  Trash2,
} from "lucide-react";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../api/projects";

const initialFormData = {
  name: "",
  description: "",
  status: "Planning",
  deadline: "",
  members: 1,
  progress: 0,
};

function formatDeadline(deadline) {
  if (!deadline) return "No deadline";

  const dateString = deadline.slice(0, 10);
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusStyle(status) {
  if (status === "Completed") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
  }

  if (status === "In Progress") {
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
  }

  return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
}

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      setLoading(true);
      setPageError("");

      const data = await getProjects();
      setProjects(data);
    } catch (error) {
      setPageError(
        error.response?.data?.message ||
          "Could not load projects. Please check your server.",
      );
    } finally {
      setLoading(false);
    }
  }

  function openCreateForm() {
    setEditingProject(null);
    setFormData({ ...initialFormData });
    setFormError("");
    setShowForm(true);
  }

  function handleEdit(project) {
    setEditingProject(project);

    setFormData({
      name: project.name,
      description: project.description,
      status: project.status,
      deadline: project.deadline ? project.deadline.slice(0, 10) : "",
      members: project.members,
      progress: project.progress ?? 0,
    });

    setFormError("");
    setShowForm(true);
  }

  function handleStatusChange(status) {
    setFormData((currentData) => ({
      ...currentData,
      status,
      progress:
        status === "Completed"
          ? 100
          : status === "Planning"
            ? 0
            : currentData.status === "Completed"
              ? 99
              : currentData.status === "Planning"
                ? 25
                : currentData.progress,
    }));
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    const name = formData.name.trim();
    const description = formData.description.trim();
    const members = Number(formData.members);

    if (!name || !description || !formData.deadline) {
      setFormError("Please fill in all required fields.");
      return;
    }

    if (name.length > 100) {
      setFormError("Project name cannot exceed 100 characters.");
      return;
    }

    if (description.length > 500) {
      setFormError("Description cannot exceed 500 characters.");
      return;
    }

    if (!Number.isInteger(members) || members < 1 || members > 100) {
      setFormError("Team members must be a whole number from 1 to 100.");
      return;
    }

    const selectedDeadline = new Date(`${formData.deadline}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (Number.isNaN(selectedDeadline.getTime()) || selectedDeadline < today) {
      setFormError("Please select today or a future deadline.");
      return;
    }

    const progress =
      formData.status === "Completed"
        ? 100
        : formData.status === "Planning"
          ? 0
          : Number(formData.progress);

    if (
      formData.status === "In Progress" &&
      (!Number.isInteger(progress) || progress < 1 || progress > 99)
    ) {
      setFormError("Progress must be a whole number from 1 to 99.");
      return;
    }

    const projectData = {
      name,
      description,
      status: formData.status,
      deadline: formData.deadline,
      members,
      progress,
    };

    try {
      setSaving(true);

      if (editingProject) {
        const updatedProject = await updateProject(
          editingProject._id,
          projectData,
        );

        setProjects((currentProjects) =>
          currentProjects.map((project) =>
            project._id === updatedProject._id ? updatedProject : project,
          ),
        );
      } else {
        const newProject = await createProject(projectData);

        setProjects((currentProjects) => [newProject, ...currentProjects]);
      }

      setShowForm(false);
      setEditingProject(null);
      setFormData({ ...initialFormData });
      setFormError("");
    } catch (error) {
      setFormError(
        error.response?.data?.message ||
          "Could not save the project. Please try again.",
      );
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
      setDeletingId(project._id);
      setPageError("");

      await deleteProject(project._id);

      setProjects((currentProjects) =>
        currentProjects.filter((item) => item._id !== project._id),
      );
    } catch (error) {
      setPageError(
        error.response?.data?.message ||
          "Could not delete the project. Please try again.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(search.toLowerCase()) ||
      project.description.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || project.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="mb-6 flex justify-end">
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          <Plus size={18} />
          New Project
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search projects..."
            className="h-11 w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-11 rounded-lg border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        >
          <option value="All">All statuses</option>
          <option value="Planning">Planning</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {pageError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
        >
          <span>{pageError}</span>
          <button
            type="button"
            onClick={loadProjects}
            className="shrink-0 font-medium underline"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <LoaderCircle size={20} className="animate-spin" />
          Loading projects...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-6 text-center dark:border-gray-700 dark:bg-gray-900">
          <FolderKanban size={36} className="mb-3 text-gray-400" />
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {search || statusFilter !== "All"
              ? "No matching projects"
              : "No projects yet"}
          </h2>
          <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
            {search || statusFilter !== "All"
              ? "Try changing your search or status filter."
              : "Create your first project to start tracking your work."}
          </p>
          {!search && statusFilter === "All" && (
            <button
              type="button"
              onClick={openCreateForm}
              className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Create project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => {
            const progress = Math.min(
              100,
              Math.max(0, Number(project.progress) || 0),
            );

            return (
              <article
                key={project._id}
                className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      <FolderKanban size={21} />
                    </div>

                    <div className="min-w-0">
                      <h2 className="break-words font-semibold text-gray-900 dark:text-white">
                        {project.name}
                      </h2>
                      <span
                        className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusStyle(project.status)}`}
                      >
                        {project.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleEdit(project)}
                      aria-label={`Edit ${project.name}`}
                      title="Edit project"
                      className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-emerald-600 dark:hover:bg-gray-800"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(project)}
                      disabled={deletingId === project._id}
                      aria-label={`Delete ${project.name}`}
                      title="Delete project"
                      className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950/30"
                    >
                      {deletingId === project._id ? (
                        <LoaderCircle size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>

                <p className="mt-4 min-h-10 text-sm leading-6 text-gray-500 dark:text-gray-400">
                  {project.description}
                </p>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      Progress
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {progress}%
                    </span>
                  </div>

                  <div
                    className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"
                    role="progressbar"
                    aria-label={`${project.name} progress`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progress}
                  >
                    <div
                      className={`h-full rounded-full transition-all ${
                        progress === 100 ? "bg-emerald-600" : "bg-emerald-500"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <CalendarDays size={15} />
                    {formatDeadline(project.deadline)}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Users size={15} />
                    {project.members}{" "}
                    {project.members === 1 ? "member" : "members"}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setShowForm(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-form-title"
            className="my-8 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900"
          >
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <h2
                  id="project-form-title"
                  className="text-xl font-bold text-gray-900 dark:text-white"
                >
                  {editingProject ? "Edit Project" : "Create Project"}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Enter the project details below.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={saving}
                aria-label="Close form"
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800"
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div
                role="alert"
                className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300"
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Project name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  maxLength={100}
                  required
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="e.g. Website Redesign"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  maxLength={500}
                  required
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="What is this project about?"
                  className="w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="status"
                    className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Status *
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={(event) => handleStatusChange(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                  >
                    <option value="Planning">Planning</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="deadline"
                    className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Deadline *
                  </label>
                  <input
                    id="deadline"
                    name="deadline"
                    type="date"
                    required
                    min={new Date().toLocaleDateString("en-CA")}
                    value={formData.deadline}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="members"
                    className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Team members *
                  </label>
                  <input
                    id="members"
                    name="members"
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    required
                    value={formData.members}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="progress"
                    className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Progress (%)
                  </label>
                  <input
                    id="progress"
                    name="progress"
                    type="number"
                    min="1"
                    max="99"
                    step="1"
                    required={formData.status === "In Progress"}
                    disabled={formData.status !== "In Progress"}
                    value={formData.progress}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:disabled:bg-gray-800"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {formData.status === "Planning"
                      ? "Planning projects start at 0%."
                      : formData.status === "Completed"
                        ? "Completed projects are set to 100%."
                        : "Enter a whole number from 1 to 99."}
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <LoaderCircle size={16} className="animate-spin" />
                  )}
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
