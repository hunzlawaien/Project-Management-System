import { useEffect, useState } from "react";
import { ListTodo, RefreshCw } from "lucide-react";
import { getTasks } from "../api/tasks";

function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const tasksPerPage = 15;

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const loadMyTasks = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getTasks();

      const myTasks = data.filter((task) => {
        const assigneeId =
          typeof task.assignee === "object"
            ? task.assignee?._id
            : task.assignee;

        return assigneeId === user._id || assigneeId === user.id;
      });

      setTasks(myTasks);
      setCurrentPage(1);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load your tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyTasks();
  }, []);

  const totalPages = Math.ceil(tasks.length / tasksPerPage);
  const startIndex = (currentPage - 1) * tasksPerPage;
  const paginatedTasks = tasks.slice(startIndex, startIndex + tasksPerPage);

  useEffect(() => {
    if (totalPages === 0) {
      if (currentPage !== 1) {
        setCurrentPage(1);
      }
      return;
    }

    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const statusStyles = {
    "To Do": "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    "In Progress":
      "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    Completed:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  };

  const priorityStyles = {
    Low: "text-gray-500 dark:text-gray-400",
    Medium: "text-amber-600 dark:text-amber-400",
    High: "text-red-600 dark:text-red-400",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Tasks
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Tasks assigned specifically to you.
          </p>
        </div>

        <button
          type="button"
          onClick={loadMyTasks}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-gray-900"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-gray-950">
          <RefreshCw
            className="mx-auto animate-spin text-emerald-500"
            size={24}
          />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Loading your tasks...
          </p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-14 text-center dark:border-gray-800 dark:bg-gray-950">
          <ListTodo className="mx-auto text-gray-400" size={36} />
          <h2 className="mt-4 font-semibold text-gray-900 dark:text-white">
            No tasks assigned yet
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Tasks assigned to you in your projects will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
                  <tr>
                    <th className="px-5 py-4 font-medium">Task</th>
                    <th className="px-5 py-4 font-medium">Project</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 font-medium">Priority</th>
                    <th className="px-5 py-4 font-medium">Due Date</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {paginatedTasks.map((task) => (
                    <tr key={task._id}>
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="mt-1 max-w-xs truncate text-xs text-gray-500 dark:text-gray-400">
                            {task.description}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                        {task.project?.name || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            statusStyles[task.status] || statusStyles["To Do"]
                          }`}
                        >
                          {task.status}
                        </span>
                      </td>

                      <td
                        className={`px-5 py-4 font-medium ${
                          priorityStyles[task.priority] || ""
                        }`}
                      >
                        {task.priority}
                      </td>

                      <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {startIndex + 1}–
                {Math.min(startIndex + tasksPerPage, tasks.length)} of{" "}
                {tasks.length} tasks
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.max(page - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900"
                >
                  Previous
                </button>

                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1,
                ).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                      currentPage === page
                        ? "bg-emerald-500 text-white"
                        : "border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.min(page + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default MyTasks;
