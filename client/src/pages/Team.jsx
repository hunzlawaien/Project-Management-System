import { useEffect, useState } from "react";
import {
  Search,
  Users,
  Mail,
  BriefcaseBusiness,
  Plus,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import {
  getTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
} from "../api/team";

const emptyForm = {
  name: "",
  email: "",
  role: "",
  department: "",
};

function Team() {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const loadMembers = async () => {
    try {
      setError("");
      const data = await getTeamMembers();
      setMembers(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load team members. Check that your backend is running.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const openAddForm = () => {
    setEditingMember(null);
    setFormData(emptyForm);
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      role: member.role,
      department: member.department || "",
    });
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingMember(null);
    setFormData(emptyForm);
    setFormError("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setFormError("");

      if (editingMember) {
        await updateTeamMember(editingMember._id, formData);
      } else {
        await createTeamMember(formData);
      }

      closeForm();
      await loadMembers();
    } catch (err) {
      setFormError(
        err.response?.data?.message || "Could not save team member.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (member) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${member.name}?`,
    );

    if (!confirmed) return;

    try {
      setDeletingId(member._id);
      setError("");

      await deleteTeamMember(member._id);

      setMembers((previous) =>
        previous.filter((item) => item._id !== member._id),
      );
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete team member.");
    } finally {
      setDeletingId("");
    }
  };

  const searchText = search.toLowerCase();

  const filteredMembers = members.filter((member) => {
    return (
      member.name.toLowerCase().includes(searchText) ||
      member.email.toLowerCase().includes(searchText) ||
      member.role.toLowerCase().includes(searchText) ||
      (member.department || "").toLowerCase().includes(searchText)
    );
  });

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Users size={22} />
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Team Members
              </p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {members.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-blue-50 p-3 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              <BriefcaseBusiness size={22} />
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Departments
              </p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {
                  new Set(
                    members
                      .map((member) => member.department?.trim())
                      .filter(Boolean),
                  ).size
                }
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Company Directory
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage team members and their professional details.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <Plus size={18} />
            Add Member
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            {error}
          </div>
        )}

        <div className="relative mt-6 max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, role, or department..."
            aria-label="Search team members"
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:ring-emerald-900/30"
          />
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
            Loading team members...
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="py-12 text-center">
            <Users size={32} className="mx-auto mb-3 text-gray-400" />
            <p className="font-medium text-gray-900 dark:text-white">
              {search ? "No members found" : "No team members yet"}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {search
                ? "Try another name, role, or department."
                : "Add your first team member to get started."}
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredMembers.map((member) => (
              <article
                key={member._id}
                className="rounded-xl border border-gray-200 p-5 transition-colors hover:border-emerald-300 dark:border-gray-800 dark:hover:border-emerald-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      {member.name
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate font-medium text-gray-900 dark:text-white">
                        {member.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {member.role}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => openEditForm(member)}
                      aria-label={`Edit ${member.name}`}
                      title="Edit member"
                      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-emerald-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-emerald-400"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(member)}
                      disabled={deletingId === member._id}
                      aria-label={`Delete ${member.name}`}
                      title="Delete member"
                      className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2 border-t border-gray-100 pt-4 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <Mail size={16} className="shrink-0" />
                  <span className="truncate">{member.email}</span>
                </div>

                {member.department && (
                  <div className="mt-4">
                    <span className="rounded-md bg-gray-100 px-2.5 py-1.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {member.department}
                    </span>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-form-title"
            className="my-auto w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-950"
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2
                  id="team-form-title"
                  className="text-lg font-semibold text-gray-900 dark:text-white"
                >
                  {editingMember ? "Edit Team Member" : "Add Team Member"}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Enter the member's professional details.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                aria-label="Close form"
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="member-name"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Full Name
                </label>
                <input
                  id="member-name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  maxLength={100}
                  required
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label
                  htmlFor="member-email"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Email Address
                </label>
                <input
                  id="member-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  maxLength={150}
                  required
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="member-role"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Job Role
                </label>
                <input
                  id="member-role"
                  name="role"
                  type="text"
                  value={formData.role}
                  onChange={handleChange}
                  maxLength={100}
                  required
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="e.g. Frontend Developer"
                />
              </div>

              <div>
                <label
                  htmlFor="member-department"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Department{" "}
                  <span className="font-normal text-gray-400">(Optional)</span>
                </label>
                <input
                  id="member-department"
                  name="department"
                  type="text"
                  value={formData.department}
                  onChange={handleChange}
                  maxLength={100}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="e.g. Engineering"
                />
              </div>

              {formError && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
                >
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingMember
                      ? "Save Changes"
                      : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Team;
