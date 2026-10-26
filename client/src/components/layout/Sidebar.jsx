import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Settings,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Projects", icon: FolderKanban, path: "/projects" },
  { label: "Tasks", icon: CheckSquare, path: "/tasks" },
  { label: "Team", icon: Users, path: "/team" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="mb-8 px-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Project<span className="text-emerald-600">Management</span>
        </h1>
      </div>

      <nav className="flex-1 space-y-1 px-3">
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
    </aside>
  );
}

export default Sidebar;
