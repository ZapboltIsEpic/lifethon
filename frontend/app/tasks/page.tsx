"use client";

import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Difficulty = "EASY" | "MEDIUM" | "HARD";
type TaskType = "DAILY" | "WEEKLY" | "CUSTOM";
type Category = "FITNESS" | "STUDY" | "HEALTH" | "SOCIAL" | "WORK" | "OTHER";
type Status = "PENDING" | "COMPLETED" | "FAILED";

interface Task {
  id: number;
  title: string;
  description: string;
  category: Category;
  difficulty: Difficulty;
  taskType: TaskType;
  coinReward: number;
  gachaPullReward: number;
  dueDate: string | null;
  repeatSchedule: string | null;
  status: Status;
  isOwned: boolean;
}

interface CreateTaskForm {
  title: string;
  description: string;
  category: Category;
  difficulty: Difficulty;
  dueDate: string;
  repeatSchedule: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { label: string; color: string; bg: string; coins: number }
> = {
  EASY: {
    label: "Easy",
    color: "text-green-600",
    bg: "bg-green-50",
    coins: 10,
  },
  MEDIUM: {
    label: "Medium",
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    coins: 25,
  },
  HARD: { label: "Hard", color: "text-red-600", bg: "bg-red-50", coins: 50 },
};

const TYPE_CONFIG: Record<
  TaskType,
  { label: string; color: string; icon: string }
> = {
  DAILY: { label: "Daily", color: "text-blue-500", icon: "🌅" },
  WEEKLY: { label: "Weekly", color: "text-purple-500", icon: "📅" },
  CUSTOM: { label: "Custom", color: "text-gray-500", icon: "⚡" },
};

const CATEGORY_EMOJI: Record<Category, string> = {
  FITNESS: "💪",
  STUDY: "📚",
  HEALTH: "🏥",
  SOCIAL: "👥",
  WORK: "💼",
  OTHER: "✨",
};

const API = "http://localhost:8081";
const EMPTY_FORM: CreateTaskForm = {
  title: "",
  description: "",
  category: "OTHER",
  difficulty: "EASY",
  dueDate: "",
  repeatSchedule: "",
};

// ── Subcomponents ─────────────────────────────────────────────────────────────

const DifficultyBadge = ({ difficulty }: { difficulty: Difficulty }) => {
  const cfg = DIFFICULTY_CONFIG[difficulty];
  return (
    <span
      className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.color} ${cfg.bg}`}
    >
      {cfg.label}
    </span>
  );
};

const TaskCard = ({
  task,
  onComplete,
  onDelete,
}: {
  task: Task;
  onComplete: (id: number) => void;
  onDelete: (id: number) => void;
}) => {
  const typeCfg = TYPE_CONFIG[task.taskType];
  const completed = task.status === "COMPLETED";

  return (
    <div
      className={`bg-white rounded-xl shadow p-5 border-l-4 transition-all ${
        completed
          ? "border-green-400 opacity-70"
          : "border-indigo-400 hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: icon + info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-2xl mt-0.5">
            {CATEGORY_EMOJI[task.category]}
          </span>
          <div className="flex-1 min-w-0">
            <p
              className={`font-semibold text-gray-800 truncate ${completed ? "line-through text-gray-400" : ""}`}
            >
              {task.title}
            </p>
            {task.description && (
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                {task.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`text-xs font-medium ${typeCfg.color}`}>
                {typeCfg.icon} {typeCfg.label}
              </span>
              <DifficultyBadge difficulty={task.difficulty} />
              <span className="text-xs text-yellow-600 font-medium">
                💰 {task.coinReward}
              </span>
              {task.gachaPullReward > 0 && (
                <span className="text-xs text-purple-600 font-medium">
                  🎰 +{task.gachaPullReward} pull
                </span>
              )}
              {task.dueDate && (
                <span className="text-xs text-gray-400">
                  📆 {new Date(task.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 shrink-0">
          {!completed && (
            <button
              onClick={() => onComplete(task.id)}
              className="w-8 h-8 rounded-full border-2 border-indigo-400 flex items-center justify-center text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all"
              title="Mark complete"
            >
              ✓
            </button>
          )}
          {completed && (
            <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 text-sm">
              ✓
            </span>
          )}
          {task.isOwned && (
            <button
              onClick={() => onDelete(task.id)}
              className="w-8 h-8 rounded-full border-2 border-red-200 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
              title="Delete task"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Reward Toast ──────────────────────────────────────────────────────────────

const RewardToast = ({
  result,
  onClose,
}: {
  result: { taskTitle: string; coinsEarned: number; gachaPullsEarned: number };
  onClose: () => void;
}) => (
  <div className="fixed bottom-6 right-6 bg-gray-900 text-white rounded-2xl shadow-2xl p-5 z-50 max-w-xs animate-bounce-once">
    <p className="font-bold text-lg mb-1">✅ Task Complete!</p>
    <p className="text-gray-300 text-sm mb-3 truncate">{result.taskTitle}</p>
    <div className="flex gap-3">
      <span className="bg-yellow-500/20 text-yellow-300 rounded-lg px-3 py-1 text-sm font-semibold">
        +{result.coinsEarned} 💰
      </span>
      {result.gachaPullsEarned > 0 && (
        <span className="bg-purple-500/20 text-purple-300 rounded-lg px-3 py-1 text-sm font-semibold">
          +{result.gachaPullsEarned} 🎰
        </span>
      )}
    </div>
    <button
      onClick={onClose}
      className="absolute top-3 right-3 text-gray-500 hover:text-white text-sm"
    >
      ✕
    </button>
  </div>
);

// ── Create Task Modal ─────────────────────────────────────────────────────────

const CreateTaskModal = ({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (form: CreateTaskForm) => void;
}) => {
  const [form, setForm] = useState<CreateTaskForm>(EMPTY_FORM);

  const set = (field: keyof CreateTaskForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-800 mb-5">
          ⚡ New Custom Task
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">
              Title *
            </label>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Run 5km"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Optional details..."
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {(Object.keys(CATEGORY_EMOJI) as Category[]).map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_EMOJI[c]} {c.charAt(0) + c.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">
                Difficulty
              </label>
              <select
                value={form.difficulty}
                onChange={(e) => set("difficulty", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((d) => (
                  <option key={d} value={d}>
                    {DIFFICULTY_CONFIG[d].label} (+{DIFFICULTY_CONFIG[d].coins}{" "}
                    💰)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">
              Due Date
            </label>
            <input
              type="datetime-local"
              value={form.dueDate}
              onChange={(e) => set("dueDate", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">
              Repeat Schedule
            </label>
            <input
              value={form.repeatSchedule}
              onChange={(e) => set("repeatSchedule", e.target.value)}
              placeholder="e.g. Every Monday morning"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-600 font-semibold text-sm hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (form.title.trim()) onCreate(form);
            }}
            disabled={!form.title.trim()}
            className="flex-1 py-2 rounded-lg bg-indigo-500 text-white font-semibold text-sm hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

const TasksPage = () => {
  const { user, isLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState<{
    taskTitle: string;
    coinsEarned: number;
    gachaPullsEarned: number;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<TaskType | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<Status | "ALL">("ALL");

  useEffect(() => {
    if (user) fetchTasks();
  }, [user]);

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const fetchTasks = async () => {
    setFetching(true);
    try {
      const res = await fetch(`${API}/api/tasks`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      setTasks(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFetching(false);
    }
  };

  const handleComplete = async (taskId: number) => {
    try {
      const res = await fetch(`${API}/api/tasks/${taskId}/complete`, {
        method: "POST",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error);
        return;
      }
      const result = await res.json();
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: "COMPLETED" } : t)),
      );
      setToast(result);
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (form: CreateTaskForm) => {
    try {
      const res = await fetch(`${API}/api/tasks`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          ...form,
          dueDate: form.dueDate || null,
          repeatSchedule: form.repeatSchedule || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const created: Task = await res.json();
      setTasks((prev) => [created, ...prev]);
      setShowCreate(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`${API}/api/tasks/${deleteTarget}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      setTasks((prev) => prev.filter((t) => t.id !== deleteTarget));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteTarget(null);
    }
  };

  const filtered = tasks.filter((t) => {
    const matchType = typeFilter === "ALL" || t.taskType === typeFilter;
    const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
    return matchType && matchStatus;
  });

  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;

  // ── Loading / error ────────────────────────────────────────────────────────

  if (isLoading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-sm">
          <p className="text-3xl mb-3">⚠️</p>
          <p className="text-red-600 font-semibold">Failed to load tasks</p>
          <p className="text-red-400 text-sm mt-1 font-mono">{error}</p>
          <button
            onClick={fetchTasks}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">✅ Tasks</h1>
              <p className="text-gray-500 text-sm mt-1">
                {completedCount} / {tasks.length} completed today
              </p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-indigo-500 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-indigo-600 transition-colors"
            >
              + New Task
            </button>
          </div>

          {/* Progress bar */}
          <div className="bg-white rounded-xl shadow p-4 mb-6">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Daily Progress</span>
              <span>
                {tasks.length > 0
                  ? Math.round((completedCount / tasks.length) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                style={{
                  width:
                    tasks.length > 0
                      ? `${(completedCount / tasks.length) * 100}%`
                      : "0%",
                }}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-wrap gap-3">
            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as TaskType | "ALL")
              }
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="ALL">All Types</option>
              {(Object.keys(TYPE_CONFIG) as TaskType[]).map((t) => (
                <option key={t} value={t}>
                  {TYPE_CONFIG[t].icon} {TYPE_CONFIG[t].label}
                </option>
              ))}
            </select>

            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
              {(["ALL", "PENDING", "COMPLETED"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-2 transition-colors ${
                    statusFilter === s
                      ? "bg-indigo-500 text-white"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {s === "ALL" ? "All" : s === "PENDING" ? "Pending" : "Done"}
                </button>
              ))}
            </div>
          </div>

          {/* Task list */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-16 text-center">
              <p className="text-4xl mb-3">✅</p>
              <p className="text-gray-500 font-semibold">
                {tasks.length === 0
                  ? "No tasks yet"
                  : "No tasks match your filters"}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {tasks.length === 0
                  ? "Create a custom task to get started!"
                  : "Try changing your filters."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={handleComplete}
                  onDelete={(id) => setDeleteTarget(id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <CreateTaskModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xs text-center">
            <p className="text-3xl mb-3">🗑️</p>
            <h3 className="font-bold text-gray-800 text-lg">Delete task?</h3>
            <p className="text-gray-500 text-sm mt-1 mb-5">
              This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-600 font-semibold text-sm hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2 rounded-lg bg-red-500 text-white font-semibold text-sm hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reward toast */}
      {toast && <RewardToast result={toast} onClose={() => setToast(null)} />}
    </div>
  );
};

export default TasksPage;
