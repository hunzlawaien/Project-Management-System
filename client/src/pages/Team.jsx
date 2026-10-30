import { useEffect, useState } from "react";
import { Search, Users, Mail, Plus, Trash2, X } from "lucide-react";
import { getTeamMembers, addTeamMember, removeTeamMember } from "../api/team";

function Team() {
  const [members, setMembers] = useState([]);
  const [isCreator, setIsCreator] = useState(false);
  const [creatorId, setCreatorId] = useState("");
  const [search, setSearch] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadMembers() {
    try {
      setError("");

      const data = await getTeamMembers();

      setMembers(data.members);
      setIsCreator(data.isCreator);
      setCreatorId(data.creatorId);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load team members. Check your backend.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMembers();
  }, []);

  function openAddForm() {
    setEmail("");
    setFormError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEmail("");
    setFormError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setFormError("");
      setSuccess("");

      const result = await addTeamMember(email.trim());

      if (result.members) {
        setMembers(result.members);
      } else {
        await loadMembers();
      }

      setSuccess(result.message || "Team member added successfully.");
      closeForm();
    } catch (err) {
      setFormError(
        err.response?.data?.message || "Could not add this team member.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(member) {
    const confirmed = window.confirm(
      `Are you sure you want to remove ${member.name} from the shared team?`,
    );

    if (!confirmed) return;

    try {
      setDeletingId(member._id);
      setError("");
      setSuccess("");

      const result = await removeTeamMember(member._id);

      setMembers((previous) =>
        previous.filter((item) => item._id !== member._id),
      );

      setSuccess(result.message || "Team member removed successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not remove this team member.",
      );
    } finally {
      setDeletingId("");
    }
  }

  const searchText = search.trim().toLowerCase();

  const filteredMembers = members.filter((member) =>
    [member.name, member.email].some((value) =>
      (value || "").toLowerCase().includes(searchText),
    ),
  );

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              My Team
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              View and manage registered CoWork team members.
            </p>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {members.length} {members.length === 1 ? "member" : "members"}
            </p>
          </div>

          {isCreator && (
            <button
              type="button"
              onClick={openAddForm}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <Plus size={18} />
              Add Team Member
            </button>
          )}
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
          >
            {error}
          </p>
        )}

        {success && (
          <p
            role="status"
            className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            {success}
          </p>
        )}

        <div className="relative mt-6 max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search team members..."
            aria-label="Search team members"
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </div>

        {loading ? (
          <p className="py-12 text-center text-sm text-gray-500">
            Loading team members...
          </p>
        ) : filteredMembers.length === 0 ? (
          <div className="py-12 text-center">
            <Users size={32} className="mx-auto mb-3 text-gray-400" />

            <p className="font-medium text-gray-900 dark:text-white">
              {searchText ? "No team members found" : "No team members yet"}
            </p>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchText
                ? "Try searching with another name or email."
                : isCreator
                  ? "Add a registered CoWork user to get started."
                  : "There are no members to display."}
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredMembers.map((member) => (
              <article
                key={member._id}
                className="rounded-xl border border-gray-200 p-5 dark:border-gray-800"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    {(member.name || "?")
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium text-gray-900 dark:text-white">
                      {member.name}
                    </h3>

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {member._id === creatorId
                        ? "Team Creator"
                        : "CoWork Member"}
                    </p>
                  </div>

                  {isCreator && member._id !== creatorId && (
                    <button
                      type="button"
                      onClick={() => handleRemove(member)}
                      disabled={deletingId === member._id}
                      aria-label={`Remove ${member.name} from team`}
                      title="Remove team member"
                      className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-red-950/40"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="mt-5 flex items-center gap-2 border-t border-gray-100 pt-4 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <Mail size={16} className="shrink-0" />
                  <span className="truncate">{member.email}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {showForm && isCreator && (
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
                  Add Team Member
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Enter the email address of a registered CoWork user.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                aria-label="Close form"
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="team-member-email"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Registered User Email
                </label>

                <input
                  id="team-member-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  required
                  maxLength={254}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
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
                  disabled={saving || !email.trim()}
                  className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Adding..." : "Add Member"}
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
