import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  ListTodo,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Projects", icon: FolderKanban, path: "/projects" },
  { label: "Tasks", icon: CheckSquare, path: "/tasks" },
  { label: "My Tasks", icon: ListTodo, path: "/my-tasks" },
  { label: "Team", icon: Users, path: "/team" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

function Sidebar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getStoredUser);

  useEffect(() => {
    const handleProfileUpdate = () => {
      setUser(getStoredUser());
    };

    window.addEventListener("profileUpdated", handleProfileUpdate);

    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate);
    };
  }, []);

  const userName = user.name || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      {/* Brand */}
      <div className="px-6 pb-7 pt-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Co<span className="text-emerald-500">Work</span>
        </h1>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Project management workspace
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.label}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-900"
                }`
              }
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Logged-in user profile */}
      <div className="border-t border-gray-200 p-4 dark:border-gray-800">
        <div className="flex items-center gap-3 rounded-lg p-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              userInitial
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
              {userName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Signed in
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out"
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-red-600 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-red-400"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
