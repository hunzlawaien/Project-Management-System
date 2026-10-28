import { useEffect, useState } from "react";
import {
  FolderKanban,
  CircleCheck,
  Clock3,
  CalendarDays,
  RefreshCw,
  ListTodo,
} from "lucide-react";
import { Link } from "react-router-dom";

import StatCard from "../components/dashboard/StatCard";
import { getProjects } from "../api/projects";
import { getTasks } from "../api/tasks";

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError("");

      const [projectData, taskData] = await Promise.all([
        getProjects(),
        getTasks(),
      ]);

      setProjects(Array.isArray(projectData) ? projectData : []);
      setTasks(Array.isArray(taskData) ? taskData : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load dashboard data. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  const totalProjects = projects.length;
  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.status === "Completed",
  ).length;

  const inProgressTasks = tasks.filter(
    (task) => task.status === "In Progress",
  ).length;

  const stats = [
    {
      title: "Total Projects",
      value: totalProjects,
      description: "Projects created",
      icon: FolderKanban,
    },
    {
      title: "Total Tasks",
      value: totalTasks,
      description: "Tasks across all projects",
      icon: ListTodo,
    },
    {
      title: "Completed Tasks",
      value: completedTasks,
      description: "Tasks finished",
      icon: CircleCheck,
    },
    {
      title: "In Progress Tasks",
      value: inProgressTasks,
      description: "Tasks being worked on",
      icon: Clock3,
    },
  ];

  const recentProjects = projects.slice(0, 5);

  function formatDeadline(deadline) {
    if (!deadline) return "No deadline";

    const date = new Date(deadline);

    if (Number.isNaN(date.getTime())) {
      return "Invalid date";
    }

    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
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

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>

          <button
            type="button"
            onClick={loadDashboardData}
            className="inline-flex items-center gap-2 text-sm font-medium text-red-700 hover:underline dark:text-red-300"
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.title}
            {...stat}
            value={loading ? "—" : stat.value}
          />
        ))}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950 sm:p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Recent Projects
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Your latest project updates by creation date.
            </p>
          </div>

          <Link
            to="/projects"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            View all
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500 dark:text-gray-400">
            <RefreshCw size={18} className="animate-spin" />
            Loading dashboard...
          </div>
        ) : error ? (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Project information is unavailable.
          </p>
        ) : recentProjects.length === 0 ? (
          <div className="py-10 text-center">
            <FolderKanban size={36} className="mx-auto mb-3 text-gray-400" />

            <p className="font-medium text-gray-900 dark:text-white">
              No projects yet
            </p>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Create your first project to see your progress here.
            </p>

            <Link
              to="/projects"
              className="mt-4 inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Go to Projects
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {recentProjects.map((project) => (
              <div key={project._id}>
                <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                      {project.name}
                    </p>

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Deadline: {formatDeadline(project.deadline)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusStyle(project.status)}`}
                    >
                      {project.status}
                    </span>

                    <span className="w-10 text-right text-xs text-gray-500 dark:text-gray-400">
                      {project.progress ?? 0}%
                    </span>
                  </div>
                </div>

                <div
                  className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"
                  role="progressbar"
                  aria-label={`${project.name} progress`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.min(
                    100,
                    Math.max(0, Number(project.progress) || 0),
                  )}
                >
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all"
                    style={{
                      width: `${Math.min(100, Math.max(0, Number(project.progress) || 0))}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950 sm:p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Recent Tasks
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              The latest tasks across your projects.
            </p>
          </div>

          <Link
            to="/tasks"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            View all
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Loading tasks...
          </div>
        ) : error ? (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Task information is unavailable.
          </p>
        ) : tasks.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No tasks yet. Create a task to see it here.
          </p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {tasks.slice(0, 5).map((task) => (
              <div
                key={task._id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                    {task.title}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Project: {task.project?.name || "Unassigned"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusStyle(task.status)}`}
                  >
                    {task.status}
                  </span>

                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    {task.priority} priority
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
