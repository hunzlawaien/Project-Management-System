import { Sun, Moon, Menu, LogOut } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const pageDetails = {
  "/": {
    title: "Dashboard",
    description: "Welcome back! Here's what's happening.",
  },
  "/dashboard": {
    title: "Dashboard",
    description: "Welcome back! Here's what's happening.",
  },
  "/projects": {
    title: "Projects",
    description: "Manage your projects and track their progress.",
  },
  "/tasks": {
    title: "Tasks",
    description: "Organize your work and keep track of deadlines.",
  },
  "/my-tasks": {
    title: "My Tasks",
    description: "View and manage the tasks assigned to you.",
  },
  "/team": {
    title: "Team",
    description: "Manage your team and collaborate on projects.",
  },
  "/settings": {
    title: "Settings",
    description: "Manage your preferences and account settings.",
  },
};

function Header({ darkMode, setDarkMode, onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();

  const currentPage = pageDetails[location.pathname] || {
    title: "CoWork",
    description: "Manage your projects and tasks in one place.",
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex min-h-[76px] items-center justify-between gap-4 border-b border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-950 sm:px-8">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
          {currentPage.title}
        </h2>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {currentPage.description}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {/* Theme toggle */}
        <button
          type="button"
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          title={darkMode ? "Light mode" : "Dark mode"}
          onClick={() => setDarkMode((previousMode) => !previousMode)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          title="Log out"
          aria-label="Log out"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <LogOut size={17} />
          <span className="hidden sm:inline">Logout</span>
        </button>

        {/* Mobile menu */}
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 md:hidden"
        >
          <Menu size={20} />
        </button>
      </div>
    </header>
  );
}

export default Header;
