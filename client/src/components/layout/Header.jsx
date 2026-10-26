import { Sun, Moon, Menu } from "lucide-react";

function Header({ darkMode, setDarkMode, onMenuClick }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-950 sm:px-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Dashboard
        </h2>
        <p className="text-xs text-gray-500">
          Welcome back! Here's what's happening.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          aria-label="Toggle theme"
          onClick={() => setDarkMode(!darkMode)}
          className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 md:hidden"
        >
          <Menu size={22} />
        </button>
      </div>
    </header>
  );
}

export default Header;
