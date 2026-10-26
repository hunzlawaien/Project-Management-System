import { FolderKanban, ListTodo, CircleCheck, Clock3 } from "lucide-react";

import StatCard from "../components/dashboard/StatCard";

const stats = [
  {
    title: "Total Projects",
    value: "12",
    description: "Projects created",
    icon: FolderKanban,
  },
  {
    title: "Total Tasks",
    value: "48",
    description: "Across all projects",
    icon: ListTodo,
  },
  {
    title: "Completed",
    value: "32",
    description: "Tasks finished",
    icon: CircleCheck,
  },
  {
    title: "In Progress",
    value: "10",
    description: "Tasks being worked on",
    icon: Clock3,
  },
];

const projects = [
  { name: "Website Redesign", progress: 75, status: "In Progress" },
  { name: "Mobile App", progress: 45, status: "In Progress" },
  { name: "Marketing Website", progress: 100, status: "Completed" },
];

const activities = [
  { text: "Website Redesign project was updated", time: "2 hours ago" },
  { text: "A task was marked as completed", time: "Yesterday" },
  { text: "Mobile App project was created", time: "2 days ago" },
];

function Dashboard() {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <section>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Overview
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Track your projects and team progress.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950 xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Recent Projects
            </h3>
            <span className="text-sm text-emerald-700 dark:text-emerald-400">
              View all
            </span>
          </div>

          <div className="space-y-5">
            {projects.map((project) => (
              <div key={project.name}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {project.name}
                  </p>
                  <span className="text-xs text-gray-500">
                    {project.progress}%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="h-full rounded-full bg-emerald-600"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>

                <p className="mt-2 text-xs text-gray-500">{project.status}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
          <h3 className="mb-5 font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h3>

          <div className="space-y-5">
            {activities.map((activity, index) => (
              <div key={index} className="border-l-2 border-emerald-500 pl-3">
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  {activity.text}
                </p>
                <p className="mt-1 text-xs text-gray-500">{activity.time}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
