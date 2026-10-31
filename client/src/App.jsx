import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import ProtectedRoute from "./components/auth/ProtectedRoute";

import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import Team from "./pages/Team";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyTasks from "./pages/MyTasks";

function AppContent() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  const [menuOpen, setMenuOpen] = useState(false);

  // Save the selected theme whenever it changes.
  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route
          path="/*"
          element={
            <div className={darkMode ? "dark" : ""}>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                {/* Desktop sidebar */}
                <div className="hidden md:block">
                  <Sidebar />
                </div>

                {/* Mobile sidebar */}
                {menuOpen && (
                  <div className="fixed inset-0 z-50 md:hidden">
                    <button
                      type="button"
                      aria-label="Close navigation menu"
                      className="absolute inset-0 bg-black/50"
                      onClick={() => setMenuOpen(false)}
                    />

                    <div className="relative z-10 h-full w-64 max-w-[85vw] overflow-y-auto bg-white dark:bg-gray-950">
                      <div className="flex justify-end p-3">
                        <button
                          type="button"
                          onClick={() => setMenuOpen(false)}
                          aria-label="Close navigation menu"
                          className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                          <span className="text-xl leading-none">×</span>
                        </button>
                      </div>

                      <Sidebar onNavigate={() => setMenuOpen(false)} />
                    </div>
                  </div>
                )}

                {/* Main content */}
                <main className="min-w-0 md:ml-64">
                  <Header
                    darkMode={darkMode}
                    setDarkMode={setDarkMode}
                    onMenuClick={() => setMenuOpen(true)}
                  />

                  <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/projects" element={<Projects />} />
                      <Route path="/tasks" element={<Tasks />} />
                      <Route path="/my-tasks" element={<MyTasks />} />
                      <Route path="/team" element={<Team />} />
                      <Route
                        path="/settings"
                        element={
                          <Settings
                            darkMode={darkMode}
                            setDarkMode={setDarkMode}
                          />
                        }
                      />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </div>
                </main>
              </div>
            </div>
          }
        />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
