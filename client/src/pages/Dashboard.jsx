import { useEffect, useState } from "react";
import {
  FolderKanban,
  CircleCheck,
  Clock3,
  RefreshCw,
  ListTodo,
  Users,
  Mail,
  CalendarDays,
  Plus,
  ArrowUpRight,
} from "lucide-react";
import { Link } from "react-router-dom";

import { getProjects } from "../api/projects";
import { getTasks } from "../api/tasks";
import { getTeamMembers } from "../api/team";

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [teamLoading, setTeamLoading] = useState(true);
  const [error, setError] = useState("");
  const [teamError, setTeamError] = useState("");

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

  async function loadTeamData() {
    try {
      setTeamLoading(true);
      setTeamError("");

      const teamData = await getTeamMembers();

      setTeamMembers(Array.isArray(teamData) ? teamData : []);
    } catch (err) {
      setTeamMembers([]);
      setTeamError(
        err.response?.data?.message || "Could not load team members.",
      );
    } finally {
      setTeamLoading(false);
    }
  }

  async function refreshDashboard() {
    await Promise.all([loadDashboardData(), loadTeamData()]);
  }

  useEffect(() => {
    refreshDashboard();
  }, []);

  const completedTasks = tasks.filter(
    (task) => task.status === "Completed",
  ).length;

  const inProgressTasks = tasks.filter(
    (task) => task.status === "In Progress",
  ).length;

  const stats = [
    {
      title: "Total Projects",
      value: projects.length,
      description: "Projects you can access",
      icon: FolderKanban,
      iconStyle:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
      loading: loading,
    },
    {
      title: "Total Tasks",
      value: tasks.length,
      description: "Across your projects",
      icon: ListTodo,
      iconStyle:
        "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
      loading: loading,
    },
    {
      title: "Completed Tasks",
      value: completedTasks,
      description: "Successfully finished",
      icon: CircleCheck,
      iconStyle:
        "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400",
      loading: loading,
    },
    {
      title: "In Progress",
      value: inProgressTasks,
      description: "Currently being worked on",
      icon: Clock3,
      iconStyle:
        "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
      loading: loading,
    },
    {
      title: "Team Members",
      value: teamMembers.length,
      description: "Project collaborators",
      icon: Users,
      iconStyle:
        "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
      loading: teamLoading,
    },
  ];

  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const recentTeamMembers = teamMembers.slice(0, 5);

  let user = {};

  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    user = {};
  }

  const currentUserId = String(user._id || user.id || "");

  const myTasks = tasks.filter((task) => {
    const assigneeId =
      typeof task.assignee === "object" ? task.assignee?._id : task.assignee;

    return currentUserId !== "" && String(assigneeId || "") === currentUserId;
  });

  const upcomingMyTasks = [...myTasks]
    .filter((task) => task.status !== "Completed")
    .sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;

      return new Date(a.dueDate) - new Date(b.dueDate);
    })
    .slice(0, 5);

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

  function getTaskDeadlineLabel(dueDate) {
    if (!dueDate) return "No due date";

    const due = new Date(dueDate);

    if (Number.isNaN(due.getTime())) {
      return "Invalid date";
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const difference = Math.round(
      (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (difference < 0) {
      return `${Math.abs(difference)} day(s) overdue`;
    }

    if (difference === 0) return "Due today";
    if (difference === 1) return "Due tomorrow";

    return `Due ${formatDeadline(dueDate)}`;
  }

  function isTaskOverdue(dueDate) {
    if (!dueDate) return false;

    const due = new Date(dueDate);

    if (Number.isNaN(due.getTime())) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    return due < today;
  }

  function getStatusStyle(status) {
    if (status === "Completed") {
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20";
    }

    if (status === "In Progress") {
      return "bg-blue-50 text-blue-700 ring-1 ring-blue-600/10 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-400/20";
    }

    return "bg-gray-100 text-gray-700 ring-1 ring-gray-500/10 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700";
  }

  function getInitials(name) {
    return (name || "U")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }

  function getPriorityStyle(priority) {
    if (priority === "High") {
      return "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400";
    }

    if (priority === "Medium") {
      return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";
    }

    return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";
  }

  function SectionHeader({ title, description, to, linkLabel = "View all" }) {
    return (
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-gray-900 dark:text-white">
            {title}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>

        <Link
          to={to}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
        >
          {linkLabel}
          <ArrowUpRight size={15} />
        </Link>
      </div>
    );
  }

  function EmptyState({ icon: Icon, title, description, to, action }) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          <Icon size={22} />
        </div>
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {title}
        </p>
        <p className="mt-1 max-w-xs text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
        {to && (
          <Link
            to={to}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            <Plus size={16} />
            {action}
          </Link>
        )}
      </div>
    );
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const firstName = user.name?.trim().split(" ")[0] || "there";

  return (
    <div className="min-h-full space-y-7 bg-gray-50/70 p-4 dark:bg-gray-950 sm:p-6 lg:p-8">
      {/* Welcome header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-3xl">
            Welcome back, {firstName}
          </h1>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Here's what's happening with your projects today.
          </p>

          <p className="mt-2 text-xs font-medium text-gray-400 dark:text-gray-500">
            {today}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={refreshDashboard}
            disabled={loading || teamLoading}
            aria-label="Refresh dashboard"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <RefreshCw
              size={16}
              className={loading || teamLoading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <Link
            to="/projects"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Plus size={17} />
            New Project
          </Link>
        </div>
      </section>

      {/* Main dashboard error */}
      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>

          <button
            type="button"
            onClick={loadDashboardData}
            className="inline-flex items-center gap-2 text-sm font-semibold text-red-700 hover:underline dark:text-red-300"
          >
            <RefreshCw size={15} />
            Try again
          </button>
        </div>
      )}

      {/* Statistics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm shadow-gray-200/40 transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-gray-200/50 dark:border-gray-800 dark:bg-gray-900 dark:shadow-none dark:hover:border-gray-700"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {stat.title}
                </p>

                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.iconStyle}`}
                >
                  <Icon size={19} />
                </div>
              </div>

              <p className="mt-4 text-3xl font-bold tracking-tight text-gray-950 dark:text-white">
                {stat.loading ? (
                  <span className="text-gray-300 dark:text-gray-700">—</span>
                ) : (
                  stat.value
                )}
              </p>

              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {stat.description}
              </p>
            </div>
          );
        })}
      </section>

      {/* Projects and my tasks */}
      <section className="grid grid-cols-1 items-start gap-5 xl:grid-cols-5">
        {/* Recent projects */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm shadow-gray-200/40 dark:border-gray-800 dark:bg-gray-900 dark:shadow-none sm:p-6 xl:col-span-3">
          <SectionHeader
            title="Recent Projects"
            description="Your latest projects and their progress."
            to="/projects"
          />

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500 dark:text-gray-400">
              <RefreshCw size={17} className="animate-spin" />
              Loading projects...
            </div>
          ) : error ? (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Project information is unavailable.
            </p>
          ) : recentProjects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No projects yet"
              description="Create your first project to start organizing your work."
              to="/projects"
              action="Create project"
            />
          ) : (
            <div className="space-y-5">
              {recentProjects.map((project) => {
                const progress = Math.min(
                  100,
                  Math.max(0, Number(project.progress) || 0),
                );

                return (
                  <div
                    key={project._id}
                    className="rounded-xl border border-gray-100 p-4 transition hover:border-emerald-200 dark:border-gray-800 dark:hover:border-emerald-900"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                          {project.name}
                        </p>

                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Deadline: {formatDeadline(project.deadline)}
                        </p>
                      </div>

                      <span
                        className={`w-fit shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${getStatusStyle(project.status)}`}
                      >
                        {project.status}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-500 dark:text-gray-400">
                        Project progress
                      </span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {progress}%
                      </span>
                    </div>

                    <div
                      className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"
                      role="progressbar"
                      aria-label={`${project.name} progress`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={progress}
                    >
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* My tasks */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm shadow-gray-200/40 dark:border-gray-800 dark:bg-gray-900 dark:shadow-none sm:p-6 xl:col-span-2">
          <SectionHeader
            title="My Tasks"
            description="Your upcoming assigned work."
            to="/my-tasks"
          />

          {loading ? (
            <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
              Loading your tasks...
            </div>
          ) : error ? (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Your tasks are unavailable.
            </p>
          ) : upcomingMyTasks.length === 0 ? (
            <EmptyState
              icon={ListTodo}
              title="You're all caught up"
              description="Tasks assigned to your account will appear here."
              to="/tasks"
              action="View tasks"
            />
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {upcomingMyTasks.map((task) => {
                const overdue = isTaskOverdue(task.dueDate);

                return (
                  <div key={task._id} className="py-4 first:pt-1 last:pb-1">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {task.title}
                    </p>

                    <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                      {task.project?.name || "Unknown project"}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs ${
                          overdue
                            ? "font-medium text-red-600 dark:text-red-400"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        <CalendarDays size={13} />
                        {getTaskDeadlineLabel(task.dueDate)}
                      </span>

                      <span
                        className={`rounded-full px-2 py-1 text-[11px] font-medium ${getStatusStyle(task.status)}`}
                      >
                        {task.status}
                      </span>
                    </div>

                    <span
                      className={`mt-2 inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${getPriorityStyle(task.priority)}`}
                    >
                      {task.priority} priority
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Recent tasks and collaborators */}
      <section className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
        {/* Recent tasks */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm shadow-gray-200/40 dark:border-gray-800 dark:bg-gray-900 dark:shadow-none sm:p-6">
          <SectionHeader
            title="Recent Tasks"
            description="The latest tasks across your projects."
            to="/tasks"
          />

          {loading ? (
            <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Loading tasks...
            </div>
          ) : error ? (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Task information is unavailable.
            </p>
          ) : recentTasks.length === 0 ? (
            <EmptyState
              icon={ListTodo}
              title="No tasks yet"
              description="Create a task to see it in your recent activity."
              to="/tasks"
              action="View tasks"
            />
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {recentTasks.map((task) => (
                <div
                  key={task._id}
                  className="flex flex-col gap-3 py-4 first:pt-1 last:pb-1 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {task.title}
                    </p>

                    <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                      Project: {task.project?.name || "Unassigned"}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusStyle(task.status)}`}
                    >
                      {task.status}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${getPriorityStyle(task.priority)}`}
                    >
                      {task.priority} priority
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Project collaborators */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm shadow-gray-200/40 dark:border-gray-800 dark:bg-gray-900 dark:shadow-none sm:p-6">
          <SectionHeader
            title="Project Collaborators"
            description="People working across your projects."
            to="/team"
          />

          {teamLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500 dark:text-gray-400">
              <RefreshCw size={17} className="animate-spin" />
              Loading collaborators...
            </div>
          ) : teamError ? (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {teamError}
              </p>

              <button
                type="button"
                onClick={loadTeamData}
                className="mt-3 text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
              >
                Try again
              </button>
            </div>
          ) : recentTeamMembers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No collaborators yet"
              description="Add members to your projects to see them here."
              to="/team"
              action="View team"
            />
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {recentTeamMembers.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center gap-3 py-4 first:pt-1 last:pb-1"
                >
                  <div className="relative h-11 w-11 shrink-0">
                    {member.profilePicture && (
                      <img
                        src={member.profilePicture}
                        alt={member.name || "Profile"}
                        className="h-11 w-11 rounded-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                          event.currentTarget.nextElementSibling.style.display =
                            "flex";
                        }}
                      />
                    )}

                    <div
                      className={`absolute inset-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 ${
                        member.profilePicture ? "hidden" : "flex"
                      }`}
                    >
                      {getInitials(member.name)}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {member.name}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                      {member.email}
                    </p>

                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                      {member.projects?.length || 0}{" "}
                      {(member.projects?.length || 0) === 1
                        ? "project"
                        : "projects"}
                    </p>
                  </div>

                  <a
                    href={`mailto:${member.email}`}
                    title={`Email ${member.name}`}
                    aria-label={`Email ${member.name}`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-400 transition hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
                  >
                    <Mail size={17} />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
