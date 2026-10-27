import { useEffect, useState } from "react";
import {
  FolderKanban,
  CircleCheck,
  Clock3,
  CalendarDays,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

import StatCard from "../components/dashboard/StatCard";
import { getProjects } from "../api/projects";

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProjects() {
    try {
      setLoading(true);
      setError("");

      const data = await getProjects();
      setProjects(Array.isArray(data) ? data : []);
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
    loadProjects();
  }, []);

  const totalProjects = projects.length;

  const inProgressProjects = projects.filter(
    (project) => project.status === "In Progress",
  ).length;

  const completedProjects = projects.filter(
    (project) => project.status === "Completed",
  ).length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingDeadlines = projects.filter((project) => {
    if (!project.deadline || project.status === "Completed") {
      return false;
    }

    const deadline = new Date(project.deadline);
    deadline.setHours(0, 0, 0, 0);

    return deadline >= today;
  }).length;

  const stats = [
    {
      title: "Total Projects",
      value: totalProjects,
      description: "Projects created",
      icon: FolderKanban,
    },
    {
      title: "In Progress",
      value: inProgressProjects,
      description: "Projects being worked on",
      icon: Clock3,
    },
    {
      title: "Completed",
      value: completedProjects,
      description: "Finished projects",
      icon: CircleCheck,
    },
    {
      title: "Upcoming Deadlines",
      value: upcomingDeadlines,
      description: "Active projects due today or later",
      icon: CalendarDays,
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
            onClick={loadProjects}
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
            <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500 dark:text-gray-400">
            <RefreshCw size={18} className="animate-spin" />
            Loading projects...
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
                  aria-valuenow={project.progress ?? 0}
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
    </div>
  );
}

export default Dashboard;
