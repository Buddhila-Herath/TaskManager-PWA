"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckSquare2, LayoutList, Users, UserCircle2 } from "lucide-react";
import type { AuthUser } from "../../lib/authApi";
import { ADMIN_DASHBOARD_ROUTE, DASHBOARD_ROUTE } from "../../lib/constants";
import {
  fetchAdminTasks,
  fetchAdminUsers,
  type AdminTaskWithUser,
  type AdminUser,
} from "../../lib/adminApi";

type AdminView = "users" | "tasks";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [view, setView] = useState<AdminView>("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tasks, setTasks] = useState<AdminTaskWithUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const token = window.localStorage.getItem("authToken");
    const storedUser = window.localStorage.getItem("authUser");

    if (!token) {
      router.replace("/");
      return;
    }

    if (!storedUser) {
      router.replace(DASHBOARD_ROUTE);
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser) as AuthUser;
      setAuthUser(parsedUser);

      if (parsedUser.role !== "admin") {
        router.replace(DASHBOARD_ROUTE);
        return;
      }
    } catch {
      router.replace(DASHBOARD_ROUTE);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [usersData, tasksData] = await Promise.all([
          fetchAdminUsers(),
          fetchAdminTasks(),
        ]);
        setUsers(usersData);
        setTasks(tasksData);
      } catch {
        setError("Unable to load admin data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [router]);

  const filteredTasks = useMemo(() => {
    if (!selectedUserId) {
      return tasks;
    }
    return tasks.filter((task) => task.user?.id === selectedUserId);
  }, [selectedUserId, tasks]);

  const handleBackToUserDashboard = () => {
    router.push(DASHBOARD_ROUTE);
  };

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Mobile sidebar / nav */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-30 flex md:hidden">
          <div className="flex w-64 flex-col border-r border-slate-200 bg-white/95 backdrop-blur-sm">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
                  <CheckSquare2 className="h-4 w-4" />
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-slate-900">TaskFlow</p>
                  <p className="text-[11px] text-slate-400">Admin</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(false)}
                aria-label="Close navigation"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            <nav className="mt-2 flex-1 space-y-1 px-2 py-1 text-sm">
              <button
                type="button"
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                  view === "users"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
                onClick={() => {
                  setView("users");
                  setIsMobileNavOpen(false);
                }}
              >
                <Users
                  className={`h-4 w-4 ${
                    view === "users" ? "text-indigo-600" : "text-slate-400"
                  }`}
                />
                <span>All Users</span>
              </button>
              <button
                type="button"
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                  view === "tasks"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
                onClick={() => {
                  setView("tasks");
                  setIsMobileNavOpen(false);
                }}
              >
                <LayoutList
                  className={`h-4 w-4 ${
                    view === "tasks" ? "text-indigo-600" : "text-slate-400"
                  }`}
                />
                <span>All Tasks</span>
              </button>
            </nav>

            <div className="border-t border-slate-200 px-4 py-4 text-xs text-slate-500">
              <p className="font-medium text-slate-700">Signed in as</p>
              <p className="truncate text-[11px]">
                {authUser?.email ?? "Admin user"}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="flex-1 bg-slate-900/40"
            onClick={() => setIsMobileNavOpen(false)}
            aria-label="Close navigation overlay"
          />
        </div>
      )}
      {/* Sidebar */}
      <aside className="hidden w-64 border-r border-slate-200 bg-white/80 backdrop-blur-sm md:flex md:flex-col">
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
            <CheckSquare2 className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-900">TaskFlow</p>
            <p className="text-[11px] text-slate-400">Admin</p>
          </div>
        </div>

        <nav className="mt-2 flex-1 space-y-1 px-2 py-1 text-sm">
          <button
            type="button"
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
              view === "users"
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
            onClick={() => setView("users")}
          >
            <Users
              className={`h-4 w-4 ${
                view === "users" ? "text-indigo-600" : "text-slate-400"
              }`}
            />
            <span>All Users</span>
          </button>
          <button
            type="button"
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
              view === "tasks"
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
            onClick={() => setView("tasks")}
          >
            <LayoutList
              className={`h-4 w-4 ${
                view === "tasks" ? "text-indigo-600" : "text-slate-400"
              }`}
            />
            <span>All Tasks</span>
          </button>
        </nav>

        <div className="border-t border-slate-200 px-4 py-4 text-xs text-slate-500">
          <p className="font-medium text-slate-700">Signed in as</p>
          <p className="truncate text-[11px]">
            {authUser?.email ?? "Admin user"}
          </p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white/70 px-4 py-3 backdrop-blur-sm md:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm md:hidden"
              aria-label="Open navigation"
            >
              {/* simple menu icon using three dots to avoid extra imports */}
              <span className="block h-0.5 w-4 rounded-full bg-slate-500" />
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md md:hidden">
              <CheckSquare2 className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900">
                Admin Dashboard
              </p>
              <p className="text-[11px] text-slate-400">
                Manage users and tasks
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleBackToUserDashboard}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700"
          >
            <UserCircle2 className="h-4 w-4" />
            <span>My dashboard</span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-4">
            {error && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="mt-6 rounded-2xl border border-slate-100 bg-white/90 px-6 py-8 text-center text-xs text-slate-500 shadow-sm">
                Loading admin data...
              </div>
            ) : view === "users" ? (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-semibold text-slate-900">
                      All users
                    </h1>
                    <p className="mt-1 text-xs text-slate-500">
                      {users.length} user{users.length === 1 ? "" : "s"} total
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="hidden bg-slate-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:grid md:grid-cols-5">
                    <div>Email</div>
                    <div>User name</div>
                    <div>Role</div>
                    <div>Mobile</div>
                    <div>Joined</div>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {users.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          setSelectedUserId(
                            selectedUserId === user.id ? null : user.id,
                          );
                          setView("tasks");
                        }}
                        className="flex w-full flex-col gap-1 px-4 py-3 text-left text-xs text-slate-700 hover:bg-slate-50 md:grid md:grid-cols-5 md:items-center"
                      >
                        <div className="truncate font-medium">
                          {user.email}
                        </div>
                        <div className="truncate text-slate-600">
                          {user.userName || "—"}
                        </div>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                          {user.role ?? "user"}
                        </div>
                        <div className="truncate text-slate-600">
                          {user.mobile || "—"}
                        </div>
                        <div className="text-slate-500">
                          {formatDate(user.createdAt)}
                        </div>
                      </button>
                    ))}
                    {users.length === 0 && (
                      <div className="px-4 py-6 text-center text-xs text-slate-500">
                        No users found.
                      </div>
                    )}
                  </div>
                </div>
              </section>
            ) : (
              <section className="space-y-3">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                  <div>
                    <h1 className="text-xl font-semibold text-slate-900">
                      All tasks
                    </h1>
                    <p className="mt-1 text-xs text-slate-500">
                      {tasks.length} task{tasks.length === 1 ? "" : "s"} total
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUserId(null);
                        setView("users");
                      }}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700"
                    >
                      <span>← Back</span>
                    </button>
                    <select
                      value={selectedUserId ?? ""}
                      onChange={(event) =>
                        setSelectedUserId(
                          event.target.value || null,
                        )
                      }
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="">All users</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.userName || user.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="hidden bg-slate-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:grid md:grid-cols-5">
                    <div>Task</div>
                    <div>Owner</div>
                    <div>Status</div>
                    <div>Priority</div>
                    <div>Updated</div>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {filteredTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex flex-col gap-1 px-4 py-3 text-xs text-slate-700 md:grid md:grid-cols-5 md:items-center"
                      >
                        <div>
                          <p className="font-medium truncate">{task.title}</p>
                          {task.description && (
                            <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">
                              {task.description}
                            </p>
                          )}
                        </div>
                        <div className="truncate text-slate-600">
                          {task.user?.userName ||
                            task.user?.email ||
                            "—"}
                        </div>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                          {task.status}
                        </div>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                          {task.priority}
                        </div>
                        <div className="text-slate-500">
                          {formatDate(task.updatedAt)}
                        </div>
                      </div>
                    ))}
                    {filteredTasks.length === 0 && (
                      <div className="px-4 py-6 text-center text-xs text-slate-500">
                        No tasks found for the selected filter.
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

