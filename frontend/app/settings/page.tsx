"use client";

import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useApi } from "../lib/api";

interface Toast {
  msg: string;
  type: "success" | "error";
}

// ── Reusable sub-components ───────────────────────────────────────────────────

const SectionCard = ({
  title,
  description,
  icon,
  danger = false,
  children,
}: {
  title: string;
  description: string;
  icon: string;
  danger?: boolean;
  children: React.ReactNode;
}) => (
  <div
    className={`bg-white rounded-2xl shadow-sm overflow-hidden
    ${danger ? "border border-red-100" : "border border-gray-100"}`}
  >
    <div
      className={`px-6 py-5 border-b ${danger ? "border-red-50" : "border-gray-50"}`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <h2
            className={`font-bold text-lg ${danger ? "text-red-700" : "text-gray-800"}`}
          >
            {title}
          </h2>
          <p
            className={`text-sm mt-0.5 ${danger ? "text-red-300" : "text-gray-400"}`}
          >
            {description}
          </p>
        </div>
      </div>
    </div>
    <div className="px-6 py-6">{children}</div>
  </div>
);

const Field = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  hint,
  readOnly = false,
}: {
  label: string;
  type?: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  hint?: string;
  readOnly?: boolean;
}) => (
  <div>
    <label className="block text-sm font-semibold text-gray-600 mb-1.5">
      {label}
    </label>
    <input
      type={type}
      value={value}
      readOnly={readOnly}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className={`w-full border rounded-xl px-4 py-2.5 text-sm transition-all
        ${
          readOnly
            ? "border-gray-100 bg-gray-50 text-gray-400 cursor-default"
            : "border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent placeholder:text-gray-300"
        }
      `}
    />
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

const StrengthBar = ({ password }: { password: string }) => {
  if (!password) return null;
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  const trackColors = [
    "bg-red-400",
    "bg-orange-400",
    "bg-yellow-400",
    "bg-green-400",
  ];
  const textColors = [
    "text-red-400",
    "text-orange-400",
    "text-yellow-500",
    "text-green-500",
  ];
  const labels = ["Weak", "Fair", "Good", "Strong"];
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all ${i < score ? trackColors[score - 1] : "bg-gray-100"}`}
          />
        ))}
      </div>
      <p
        className={`text-xs font-medium ${textColors[score - 1] ?? "text-gray-300"}`}
      >
        {labels[score - 1] ?? "Very Weak"}
      </p>
    </div>
  );
};

// ── Locked panel shown to OAuth users ─────────────────────────────────────────
const OAuthLockedPanel = ({ provider }: { provider: string }) => {
  const providerName =
    provider === "GOOGLE"
      ? "Google"
      : provider.charAt(0) + provider.slice(1).toLowerCase();
  const icon = provider === "GOOGLE" ? "🔵" : "🔷";
  return (
    <div className="flex items-start gap-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
      <span className="text-3xl mt-0.5">{icon}</span>
      <div>
        <p className="font-bold text-blue-800 text-sm">
          You're signed in with {providerName}
        </p>
        <p className="text-sm text-blue-600 mt-1 leading-relaxed">
          Your password is managed by {providerName}. To change it, visit
          your&nbsp;
          {provider === "GOOGLE" && (
            <a
              href="https://myaccount.google.com/security"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium hover:text-blue-800"
            >
              Google Account security settings
            </a>
          )}
          .
        </p>
        <p className="text-xs text-blue-400 mt-2">
          You can still change your Lifethon email address below.
        </p>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user, logout } = useAuth();
  const api = useApi();
  const isOAuth = user?.authProvider !== "LOCAL";

  // Password form
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  // Email form
  const [newEmail, setNewEmail] = useState("");
  const [emailPw, setEmailPw] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // Danger zone
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState<Toast | null>(null);
  const showToast = (msg: string, type: Toast["type"] = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) {
      showToast("New passwords don't match.", "error");
      return;
    }
    if (newPw.length < 6) {
      showToast("Password must be at least 6 characters.", "error");
      return;
    }
    if (newPw === currentPw) {
      showToast("New password must differ from current.", "error");
      return;
    }
    setPwLoading(true);
    try {
      const res = await api.post("/api/users/change-password", {
        currentPassword: currentPw,
        newPassword: newPw,
      });
      if (res.ok) {
        showToast("Password updated successfully! 🔐");
        setCurrentPw("");
        setNewPw("");
        setConfirmPw("");
      } else {
        const d = await res.json();
        showToast(d.error ?? "Failed to update password.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    } finally {
      setPwLoading(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.includes("@")) {
      showToast("Enter a valid email address.", "error");
      return;
    }
    if (newEmail === user?.email) {
      showToast("That's already your email.", "error");
      return;
    }
    setEmailLoading(true);
    try {
      const res = await api.post("/api/users/change-email", {
        newEmail,
        currentPassword: isOAuth ? null : emailPw, // Google users skip password check
      });
      if (res.ok) {
        showToast("Email updated. Logging you out…");
        setTimeout(() => logout(), 1800);
      } else {
        const d = await res.json();
        showToast(d.error ?? "Failed to update email.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") {
      showToast("Type DELETE in the box to confirm.", "error");
      return;
    }
    setDeleteLoading(true);
    try {
      const res = await api.delete(`/api/users/${user?.userId}`);
      if (res.ok) {
        await logout();
      } else {
        showToast("Failed to delete account.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const matchOk = newPw && confirmPw && newPw === confirmPw;
  const matchBad = confirmPw && newPw !== confirmPw;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl
          text-sm font-semibold shadow-xl whitespace-nowrap
          ${
            toast.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-600 border border-red-200"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        {/* Header */}
        <div className="mb-2">
          <h1 className="text-3xl font-black text-gray-800">⚙️ Settings</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage your account credentials and preferences
          </p>
        </div>

        {/* Account card */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-6 py-4 flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center
            text-white font-black text-lg flex-shrink-0"
          >
            {user?.email?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="font-bold text-indigo-900">{user?.email}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-indigo-400">ID: {user?.userId}</p>
              <span className="text-indigo-200">·</span>
              {/* Auth provider badge */}
              {user?.authProvider === "GOOGLE" ? (
                <span
                  className="inline-flex items-center gap-1 text-xs font-semibold
                  bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full"
                >
                  🔵 Google account
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1 text-xs font-semibold
                  bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full"
                >
                  🔑 Local account
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Change Password ───────────────────────────────────────────────── */}
        <SectionCard
          title="Change Password"
          description="Update your login password"
          icon="🔐"
        >
          {isOAuth ? (
            <OAuthLockedPanel provider={user?.authProvider ?? "GOOGLE"} />
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <Field
                label="Current Password"
                type="password"
                value={currentPw}
                onChange={setCurrentPw}
                placeholder="Enter current password"
              />
              <div>
                <Field
                  label="New Password"
                  type="password"
                  value={newPw}
                  onChange={setNewPw}
                  placeholder="Enter new password"
                />
                <StrengthBar password={newPw} />
              </div>
              <div>
                <Field
                  label="Confirm New Password"
                  type="password"
                  value={confirmPw}
                  onChange={setConfirmPw}
                  placeholder="Re-enter new password"
                />
                {matchBad && (
                  <p className="text-xs text-red-400 mt-1">
                    Passwords don't match
                  </p>
                )}
                {matchOk && (
                  <p className="text-xs text-green-500 mt-1">
                    ✓ Passwords match
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={pwLoading || !currentPw || !newPw || !confirmPw}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white
                  font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {pwLoading ? "Updating…" : "Update Password"}
              </button>
            </form>
          )}
        </SectionCard>

        {/* ── Change Email ──────────────────────────────────────────────────── */}
        <SectionCard
          title="Change Email"
          description="Update the email address on your account"
          icon="📧"
        >
          <form onSubmit={handleChangeEmail} className="space-y-4">
            <Field
              label="Current Email"
              value={user?.email ?? ""}
              readOnly
              hint="This is your current email address"
            />

            <Field
              label="New Email Address"
              type="email"
              value={newEmail}
              onChange={setNewEmail}
              placeholder="Enter new email"
            />

            {/* Only show password field for LOCAL accounts */}
            {!isOAuth && (
              <Field
                label="Confirm with Password"
                type="password"
                value={emailPw}
                onChange={setEmailPw}
                placeholder="Enter your current password to confirm"
              />
            )}

            {isOAuth && (
              <div className="text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                ℹ️ As a {user?.authProvider === "GOOGLE" ? "Google" : "OAuth"}{" "}
                user, no password is required to change your Lifethon email.
              </div>
            )}

            <div className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              ⚠️ You'll be logged out after changing your email and will need to
              log in again.
            </div>

            <button
              type="submit"
              disabled={emailLoading || !newEmail || (!isOAuth && !emailPw)}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white
                font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {emailLoading ? "Updating…" : "Update Email"}
            </button>
          </form>
        </SectionCard>

        {/* ── Danger Zone ───────────────────────────────────────────────────── */}
        <SectionCard
          title="Danger Zone"
          description="Irreversible actions — proceed with caution"
          icon="⚠️"
          danger
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Deleting your account will permanently remove all your data
              including coins, inventory, tasks, and progress. This cannot be
              undone.
            </p>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                Type{" "}
                <span className="font-mono text-red-500 bg-red-50 px-1 rounded">
                  DELETE
                </span>{" "}
                to confirm
              </label>
              <input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="w-full border border-red-200 rounded-xl px-4 py-2.5 text-sm text-gray-800
                  focus:outline-none focus:ring-2 focus:ring-red-200 transition-all placeholder:text-gray-300"
              />
            </div>
            <button
              onClick={handleDeleteAccount}
              disabled={deleteLoading || deleteConfirm !== "DELETE"}
              className="px-6 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold
                text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {deleteLoading ? "Deleting…" : "Delete My Account"}
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
