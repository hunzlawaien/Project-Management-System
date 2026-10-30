import { useEffect, useRef, useState } from "react";
import {
  UserRound,
  Palette,
  Lock,
  Building2,
  AlertTriangle,
  Save,
  Sun,
  Moon,
  Camera,
  Trash2,
  LoaderCircle,
  Eye,
  EyeOff,
} from "lucide-react";

import {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  removeProfilePicture,
  deleteAccount,
} from "../api/profile";

import { changePassword } from "../api/auth";

function Settings({ darkMode, setDarkMode }) {
  const [user, setUser] = useState({});
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await getProfile();
        const profile = response.user;

        setUser(profile);
        setName(profile.name || "");

        localStorage.setItem("user", JSON.stringify(profile));
        window.dispatchEvent(new Event("profileUpdated"));
      } catch (error) {
        setError(
          error.response?.data?.message || "Failed to load your profile.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const updateLocalUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));

    window.dispatchEvent(new Event("profileUpdated"));
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    try {
      setSaving(true);

      const response = await updateProfile({
        name: name.trim(),
      });

      updateLocalUser(response.user);
      setName(response.user.name);
      setMessage("Profile updated successfully.");
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to update your profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setMessage("");
    setError("");

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPG, PNG, or WebP image.");
      e.target.value = "";
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setError("Image size must not exceed 4MB.");
      e.target.value = "";
      return;
    }

    const imagePreview = URL.createObjectURL(file);
    setPreview(imagePreview);

    try {
      setUploading(true);

      const response = await uploadProfilePicture(file);

      updateLocalUser(response.user);
      setPreview("");
      setMessage("Profile picture updated successfully.");
    } catch (error) {
      setPreview("");
      setError(
        error.response?.data?.message ||
          "Failed to upload your profile picture.",
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handlePictureRemove = async () => {
    setMessage("");
    setError("");

    try {
      setRemoving(true);

      const response = await removeProfilePicture();

      updateLocalUser(response.user);
      setPreview("");
      setMessage("Profile picture removed successfully.");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to remove your profile picture.",
      );
    } finally {
      setRemoving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    setPasswordMessage("");
    setPasswordError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError(
        "Your new password must be different from your current password.",
      );
      return;
    }

    try {
      setChangingPassword(true);

      await changePassword({
        currentPassword,
        newPassword,
      });

      setPasswordMessage("Password changed successfully. Logging you out...");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }, 1500);
    } catch (error) {
      setPasswordError(
        error.response?.data?.message || "Failed to change your password.",
      );
    } finally {
      setChangingPassword(false);
    }
  };

  // Delete account
  const handleAccountDelete = async (e) => {
    e.preventDefault();

    setDeleteError("");

    if (!deletePassword) {
      setDeleteError("Please enter your current password.");
      return;
    }

    const confirmed = window.confirm(
      "Are you absolutely sure? Your account and all projects you own, including their tasks, will be permanently deleted. This action cannot be undone.",
    );

    if (!confirmed) return;

    try {
      setDeletingAccount(true);

      await deleteAccount(deletePassword);

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      window.location.href = "/login";
    } catch (error) {
      setDeleteError(
        error.response?.data?.message || "Failed to delete your account.",
      );
    } finally {
      setDeletingAccount(false);
    }
  };

  const sections = [
    { id: "profile", label: "Profile", icon: UserRound },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "security", label: "Security", icon: Lock },
    { id: "workspace", label: "Workspace", icon: Building2 },
    { id: "danger", label: "Danger Zone", icon: AlertTriangle },
  ];

  const profileImage = preview || user.profilePicture;
  const initials = (user.name || name || "U").charAt(0).toUpperCase();

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <LoaderCircle size={28} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-2 pb-10">
      <div className="pb-5">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Account Settings
        </h1>

        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Manage your profile, preferences, and account settings.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-gray-200 pb-3 dark:border-gray-800">
        {sections.map((section) => {
          const Icon = section.icon;

          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-emerald-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-emerald-400"
            >
              <Icon size={17} />
              {section.label}
            </a>
          );
        })}
      </div>

      <section
        id="profile"
        className="scroll-mt-28 border-b border-gray-200 pb-8 pt-6 dark:border-gray-800"
      >
        <div className="mb-6">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Profile Information
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Update your personal information and profile picture.
          </p>
        </div>

        <div className="mb-7 flex flex-wrap items-center gap-5">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-2xl font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}

            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                <LoaderCircle size={24} className="animate-spin" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="font-medium text-gray-900 dark:text-white">
              {user.name || "User"}
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || removing}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900"
              >
                <Camera size={16} />
                {user.profilePicture ? "Change Photo" : "Upload Photo"}
              </button>

              {user.profilePicture && (
                <button
                  type="button"
                  onClick={handlePictureRemove}
                  disabled={uploading || removing}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  {removing ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  Remove
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6 dark:border-gray-800">
          <form onSubmit={handleProfileSave} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="profileName"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Full Name
                </label>

                <input
                  id="profileName"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setMessage("");
                    setError("");
                  }}
                  required
                  maxLength={100}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="profileEmail"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Email Address
                </label>

                <input
                  id="profileEmail"
                  type="email"
                  value={user.email || ""}
                  readOnly
                  className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-4 py-2.5 text-sm text-gray-500 outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400"
                />

                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  Email address cannot be changed here.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {message && (
          <p className="mt-4 text-sm text-emerald-600 dark:text-emerald-400">
            {message}
          </p>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </section>

      {/* Appearance section */}
      <section
        id="appearance"
        className="scroll-mt-28 border-b border-gray-200 py-8 dark:border-gray-800"
      >
        <div className="mb-6">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Appearance
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Customize how CoWork looks on your device.
          </p>
        </div>

        <p className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
          Choose your theme
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setDarkMode(false)}
            className={`flex items-center gap-4 rounded-xl border p-4 text-left transition ${
              !darkMode
                ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30"
                : "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-600"
            }`}
          >
            <Sun size={24} className="text-amber-500" />

            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">
                Light Mode
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Bright and clean appearance
              </p>
            </div>

            {!darkMode && (
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setDarkMode(true)}
            className={`flex items-center gap-4 rounded-xl border p-4 text-left transition ${
              darkMode
                ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30"
                : "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-600"
            }`}
          >
            <Moon size={24} className="text-indigo-500" />

            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">
                Dark Mode
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Comfortable low-light appearance
              </p>
            </div>

            {darkMode && (
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            )}
          </button>
        </div>
      </section>

      <section
        id="security"
        className="scroll-mt-28 border-b border-gray-200 py-8 dark:border-gray-800"
      >
        <div className="flex items-center gap-3">
          <Lock size={21} className="text-emerald-600 dark:text-emerald-400" />

          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Security
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage your account password.
            </p>
          </div>
        </div>

        <div className="mt-6 max-w-xl">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Change Password
          </h3>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Choose a strong password to keep your account secure.
          </p>

          <form onSubmit={handlePasswordChange} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="currentPassword"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Current Password
              </label>

              <div className="relative">
                <input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setPasswordError("");
                    setPasswordMessage("");
                  }}
                  autoComplete="current-password"
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-11 text-sm text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />

                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  aria-label={
                    showCurrentPassword ? "Hide password" : "Show password"
                  }
                >
                  {showCurrentPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* New password */}
            <div>
              <label
                htmlFor="newPassword"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                New Password
              </label>

              <div className="relative">
                <input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordError("");
                    setPasswordMessage("");
                  }}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-11 text-sm text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />

                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  aria-label={
                    showNewPassword ? "Hide password" : "Show password"
                  }
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Must contain at least 8 characters.
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Confirm New Password
              </label>

              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError("");
                    setPasswordMessage("");
                  }}
                  autoComplete="new-password"
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-11 text-sm text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {passwordError && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {passwordError}
              </p>
            )}

            {passwordMessage && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                {passwordMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={changingPassword}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {changingPassword ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Lock size={17} />
              )}

              {changingPassword ? "Changing Password..." : "Update Password"}
            </button>
          </form>
        </div>
      </section>

      <section id="danger" className="scroll-mt-28 pt-8">
        <div className="flex items-center gap-3">
          <AlertTriangle size={21} className="text-red-600 dark:text-red-400" />

          <div>
            <h2 className="font-semibold text-red-600 dark:text-red-400">
              Delete Account
            </h2>
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-red-200 p-5 dark:border-red-900/50">
          <div className="flex items-start gap-3">
            <Trash2
              size={20}
              className="mt-0.5 shrink-0 text-red-600 dark:text-red-400"
            />

            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Delete Account
              </p>

              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Permanently delete your account and all projects you own,
                including their tasks. Your membership will also be removed from
                other users' projects.
              </p>
            </div>
          </div>

          {!showDeleteConfirmation ? (
            <button
              type="button"
              onClick={() => {
                setShowDeleteConfirmation(true);
                setDeleteError("");
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
            >
              <Trash2 size={16} />
              Delete My Account
            </button>
          ) : (
            <form onSubmit={handleAccountDelete} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="deletePassword"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Enter your current password to confirm
                </label>

                <div className="relative max-w-md">
                  <input
                    id="deletePassword"
                    type={showDeletePassword ? "text" : "password"}
                    value={deletePassword}
                    onChange={(e) => {
                      setDeletePassword(e.target.value);
                      setDeleteError("");
                    }}
                    autoComplete="current-password"
                    required
                    disabled={deletingAccount}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-11 text-sm text-gray-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />

                  <button
                    type="button"
                    onClick={() => setShowDeletePassword(!showDeletePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    aria-label={
                      showDeletePassword ? "Hide password" : "Show password"
                    }
                  >
                    {showDeletePassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {deleteError && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {deleteError}
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={deletingAccount}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingAccount ? (
                    <LoaderCircle size={17} className="animate-spin" />
                  ) : (
                    <Trash2 size={17} />
                  )}

                  {deletingAccount ? "Deleting Account..." : "Confirm Deletion"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirmation(false);
                    setDeletePassword("");
                    setDeleteError("");
                  }}
                  disabled={deletingAccount}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

export default Settings;
