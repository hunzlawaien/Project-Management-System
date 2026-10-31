import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  ListTodo,
  CalendarDays,
  Pencil,
  Trash2,
  X,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import { getTasks, createTask, updateTask, deleteTask } from "../api/tasks";
import { getProjects } from "../api/projects";

const initialForm = {
  title: "",
  description: "",
  project: "",
  assignee: "",
  status: "To Do",
  priority: "Medium",
  dueDate: "",
};

const statusOptions = ["To Do", "In Progress", "Completed"];
const priorityOptions = ["Low", "Medium", "High"];
const tasksPerPage = 10;

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem("user") || "null");
      setCurrentUser(savedUser);
    } catch {
      setCurrentUser(null);
    }
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [taskData, projectData] = await Promise.all([
        getTasks(),
        getProjects(),
      ]);

      setTasks(Array.isArray(taskData) ? taskData : []);
      setProjects(Array.isArray(projectData) ? projectData : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load tasks. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function isProjectOwner(projectId) {
    const id = projectId?._id || projectId;

    const project = projects.find((item) => String(item._id) === String(id));

    if (!project || !currentUser) return false;

    const ownerId = project.owner?._id || project.owner || "";
    const userId = currentUser._id || currentUser.id || "";

    return String(ownerId) === String(userId);
  }

  function canEditTask(task) {
    if (isProjectOwner(task.project)) return true;

    const creatorId = task.createdBy?._id || task.createdBy;
    const userId = currentUser?._id || currentUser?.id;

    return Boolean(creatorId && userId && String(creatorId) === String(userId));
  }

  const selectedProject = projects.find(
    (project) => String(project._id) === String(form.project),
  );

  const projectMembers = selectedProject?.members || [];

  function openCreateForm() {
    setEditingTask(null);
    setForm({
      ...initialForm,
      project: projects[0]?._id || "",
    });
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(task) {
    setEditingTask(task);

    setForm({
      title: task.title || "",
      description: task.description || "",
      project: task.project?._id || task.project || "",
      assignee: task.assignee?._id || task.assignee || "",
      status: task.status || "To Do",
      priority: task.priority || "Medium",
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
    });

    setFormError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingTask(null);
    setForm(initialForm);
    setFormError("");
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => {
      if (name === "project") {
        return {
          ...current,
          project: value,
          assignee: "",
        };
      }

      return {
        ...current,
        [name]: value,
      };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (!form.title.trim()) {
      setFormError("Please enter a task title.");
      return;
    }

    if (!form.project) {
      setFormError("Please select a project.");
      return;
    }

    try {
      setSaving(true);

      if (editingTask && !canEditTask(editingTask)) {
        // Collaborators who did not create the task can update its status only.
        await updateTask(editingTask._id, {
          status: form.status,
        });
      } else {
        const taskData = {
          ...form,
          title: form.title.trim(),
          description: form.description.trim(),
          assignee: form.assignee || null,
          dueDate: form.dueDate || null,
        };

        if (editingTask) {
          await updateTask(editingTask._id, taskData);
        } else {
          await createTask(taskData);
        }
      }

      closeForm();
      await loadData();
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
          "Could not save the task. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(task) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${task.title}"?`,
    );

    if (!confirmed) return;

    try {
      setError("");
      await deleteTask(task._id);
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not delete the task. Please try again.",
      );
    }
  }

  async function handleStatusChange(task, status) {
    try {
      setError("");
      await updateTask(task._id, { status });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update task status.");
    }
  }

  const filteredTasks = tasks.filter((task) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      (task.title || "").toLowerCase().includes(searchText) ||
      (task.description || "").toLowerCase().includes(searchText) ||
      (task.project?.name || "").toLowerCase().includes(searchText) ||
      (task.assignee?.name || "").toLowerCase().includes(searchText);

    const matchesStatus =
      statusFilter === "All" || task.status === statusFilter;

    const matchesPriority =
      priorityFilter === "All" || task.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Calculate the number of pages and tasks for the current page.
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);

  const startIndex = (currentPage - 1) * tasksPerPage;

  const paginatedTasks = filteredTasks.slice(
    startIndex,
    startIndex + tasksPerPage,
  );

  // Reset pagination when the search or filters change.
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, priorityFilter]);

  // Keep the current page valid after deleting or filtering tasks.
  useEffect(() => {
    if (totalPages === 0) {
      if (currentPage !== 1) setCurrentPage(1);
      return;
    }

    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function statusStyle(status) {
    if (status === "Completed") {
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
    }

    if (status === "In Progress") {
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
    }

    return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  }

  function priorityStyle(priority) {
    if (priority === "High") {
      return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
    }

    if (priority === "Medium") {
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
    }

    return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  }

  function formatDate(dateValue) {
    if (!dateValue) return "No due date";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "Invalid date";

    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openCreateForm}
          disabled={projects.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={18} />
          New Task
        </button>
      </div>

      {projects.length === 0 && !loading && !error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          Create a project first before adding tasks.
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-2 font-medium hover:underline"
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Tasks
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {loading ? "—" : tasks.length}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            In Progress
          </p>
          <p className="mt-2 text-2xl font-bold text-blue-600">
            {loading
              ? "—"
              : tasks.filter((task) => task.status === "In Progress").length}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
          <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {loading
              ? "—"
              : tasks.filter((task) => task.status === "Completed").length}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tasks, projects, or assignees..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:focus:ring-emerald-900/40"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-emerald-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200"
        >
          <option value="All">All statuses</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          value={priorityFilter}
          onChange={(event) => setPriorityFilter(event.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-emerald-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200"
        >
          <option value="All">All priorities</option>
          {priorityOptions.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-gray-500 dark:text-gray-400">
            <LoaderCircle size={20} className="animate-spin" />
            Loading tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center">
            <ListTodo size={36} className="mx-auto mb-3 text-gray-400" />
            <p className="font-medium text-gray-900 dark:text-white">
              {tasks.length === 0 ? "No tasks yet" : "No matching tasks"}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {tasks.length === 0
                ? "Create a task to start organizing your work."
                : "Try changing your search or filters."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                <tr>
                  {[
                    "Task",
                    "Project",
                    "Assignee",
                    "Status",
                    "Priority",
                    "Due Date",
                    "Actions",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {paginatedTasks.map((task) => {
                  const canManageTask = isProjectOwner(task.project);
                  const canEdit = canEditTask(task);

                  return (
                    <tr
                      key={task._id}
                      className="transition hover:bg-gray-50 dark:hover:bg-gray-900/60"
                    >
                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="mt-1 max-w-xs truncate text-xs text-gray-500 dark:text-gray-400">
                            {task.description}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {task.project?.name || "Unknown project"}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {task.assignee?.name || "Unassigned"}
                      </td>

                      <td className="px-4 py-4">
                        <select
                          aria-label={`Status for ${task.title}`}
                          value={task.status}
                          onChange={(event) =>
                            handleStatusChange(task, event.target.value)
                          }
                          className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium outline-none ${statusStyle(task.status)}`}
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${priorityStyle(task.priority)}`}
                        >
                          {task.priority}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <CalendarDays size={15} />
                          {formatDate(task.dueDate)}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          {canEdit && (
                            <button
                              type="button"
                              aria-label={`Edit ${task.title}`}
                              onClick={() => openEditForm(task)}
                              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-emerald-700 dark:hover:bg-gray-800 dark:hover:text-emerald-400"
                            >
                              <Pencil size={16} />
                            </button>
                          )}

                          {canManageTask && (
                            <button
                              type="button"
                              aria-label={`Delete ${task.title}`}
                              onClick={() => handleDelete(task)}
                              className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}

                          {!canEdit && (
                            <span className="text-xs text-gray-400">
                              Status only
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      {!loading && totalPages > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {startIndex + 1}–
            {Math.min(startIndex + tasksPerPage, filteredTasks.length)} of{" "}
            {filteredTasks.length} tasks
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => page - 1)}
              disabled={currentPage === 1}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-900"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  aria-current={currentPage === page ? "page" : undefined}
                  className={`h-9 min-w-9 rounded-lg px-3 text-sm font-medium transition ${
                    currentPage === page
                      ? "bg-emerald-600 text-white"
                      : "border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-900"
                  }`}
                >
                  {page}
                </button>
              ),
            )}

            <button
              type="button"
              onClick={() => setCurrentPage((page) => page + 1)}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-900"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) closeForm();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-form-title"
            className="my-auto w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-800 dark:bg-gray-950 sm:p-6"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2
                id="task-form-title"
                className="text-lg font-semibold text-gray-900 dark:text-white"
              >
                {editingTask ? "Edit Task" : "Create Task"}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close form"
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {editingTask && !canEditTask(editingTask) ? (
                <>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {form.title}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      You can update this task's status only.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="status"
                      className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label
                      htmlFor="title"
                      className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Task title *
                    </label>
                    <input
                      id="title"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      maxLength={100}
                      required
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                      placeholder="e.g. Design login page"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      maxLength={1000}
                      rows={3}
                      className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                      placeholder="Add task details..."
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="project"
                      className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Project *
                    </label>
                    <select
                      id="project"
                      name="project"
                      value={form.project}
                      onChange={handleChange}
                      required
                      disabled={Boolean(editingTask)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-500 disabled:opacity-60 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                    >
                      <option value="" disabled>
                        Select a project
                      </option>
                      {projects.map((project) => (
                        <option key={project._id} value={project._id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="assignee"
                      className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Assign to
                    </label>
                    <select
                      id="assignee"
                      name="assignee"
                      value={form.assignee}
                      onChange={handleChange}
                      disabled={!form.project || projectMembers.length === 0}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                    >
                      <option value="">Unassigned</option>
                      {projectMembers.map((member) => (
                        <option key={member._id} value={member._id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Only members of the selected project can be assigned.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="status"
                        className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Status
                      </label>
                      <select
                        id="status"
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="priority"
                        className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Priority
                      </label>
                      <select
                        id="priority"
                        name="priority"
                        value={form.priority}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                      >
                        {priorityOptions.map((priority) => (
                          <option key={priority} value={priority}>
                            {priority}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="dueDate"
                      className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Due date
                    </label>
                    <input
                      id="dueDate"
                      type="date"
                      name="dueDate"
                      value={form.dueDate}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                    />
                  </div>
                </>
              )}

              {formError && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300"
                >
                  {formError}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || (!editingTask && projects.length === 0)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving && (
                    <LoaderCircle size={16} className="animate-spin" />
                  )}
                  {saving
                    ? "Saving..."
                    : editingTask
                      ? "Save Changes"
                      : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tasks;
