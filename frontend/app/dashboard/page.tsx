"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  CheckSquare2,
  Circle,
  LayoutList,
  LogOut,
  Menu,
  Search,
  SortAsc,
  Clock3,
} from "lucide-react";
import { io, type Socket } from "socket.io-client";
import {
  type ApiTask,
  Task,
  TaskStatus,
  TaskInput,
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  mapTaskFromApi,
} from "../../lib/taskApi";
import {
  TaskModal,
  type TaskFormErrors,
  type TaskFormState,
  type ModalMode,
} from "../../components/tasks/TaskModal";
import { TaskCard } from "../../components/tasks/TaskCard";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { logoutUser, type AuthUser } from "../../lib/authApi";
import { API_BASE_URL } from "../../lib/constants";

const NAV_ITEMS = [
  { id: "my-tasks", label: "All Tasks", icon: LayoutList },
  { id: "in-progress", label: "In Progress", icon: Clock3 },
  { id: "completed", label: "Completed", icon: CheckCircle2 },
] as const;

export default function DashboardPage() {
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeNavId, setActiveNavId] = useState<(typeof NAV_ITEMS)[number]["id"]>(
    "my-tasks",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [formState, setFormState] = useState<TaskFormState>({
    title: "",
    description: "",
    priority: "Medium",
    dueDate: "",
  });
  const [formErrors, setFormErrors] = useState<TaskFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [taskPendingDelete, setTaskPendingDelete] = useState<Task | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const token = window.localStorage.getItem("authToken");
    const storedUser = window.localStorage.getItem("authUser");
    if (storedUser) {
      try {
        setAuthUser(JSON.parse(storedUser) as AuthUser);
      } catch {
        // ignore parse errors
      }
    }
    if (!token) {
      router.replace("/");
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await fetchTasks();
        setTasks(data);
      } catch (error) {
        setLoadError("Unable to load tasks. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const token = window.localStorage.getItem("authToken");
    if (!token) {
      return;
    }

    const socketUrl = (process.env.NEXT_PUBLIC_WS_URL ?? API_BASE_URL).replace(
      /\/+$/,
      "",
    );

    const socket: Socket = io(socketUrl, {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      setIsRealtimeConnected(true);
      socket.emit("authenticate", token);
    });

    socket.on("disconnect", () => {
      setIsRealtimeConnected(false);
    });

    socket.on("task_created", (payload: ApiTask) => {
      const created = mapTaskFromApi(payload);
      setTasks((prev) => {
        if (prev.some((task) => task.id === created.id)) {
          return prev;
        }
        return [created, ...prev];
      });
    });

    socket.on("task_updated", (payload: ApiTask) => {
      const updated = mapTaskFromApi(payload);
      setTasks((prev) =>
        prev.map((task) => (task.id === updated.id ? updated : task)),
      );
    });

    socket.on("task_deleted", (payload: { id: string }) => {
      setTasks((prev) => prev.filter((task) => task.id !== payload.id));
    });

    socket.on("auth_error", () => {
      // If auth fails, we simply stop listening on this socket instance.
      socket.disconnect();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const openCreateModal = useCallback(() => {
    setModalMode("create");
    setSelectedTask(null);
    setFormState({
      title: "",
      description: "",
      priority: "Medium",
      dueDate: "",
    });
    setFormErrors({});
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((task: Task) => {
    setModalMode("edit");
    setSelectedTask(task);
    setFormState({
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
    });
    setFormErrors({});
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const validateForm = (state: TaskFormState): TaskFormErrors => {
    const errors: TaskFormErrors = {};
    if (!state.title.trim()) {
      errors.title = "Task title is required.";
    }
    return errors;
  };

  const handleFormChange = useCallback(
    <K extends keyof TaskFormState>(key: K, value: TaskFormState[K]) => {
      setFormState((prev) => ({ ...prev, [key]: value }));
      setFormErrors((prev) => ({ ...prev, [key]: undefined }));
    },
    [],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const errors = validateForm(formState);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const input: TaskInput = {
      title: formState.title.trim(),
      description: formState.description.trim(),
      priority: formState.priority,
      dueDate: formState.dueDate || undefined,
    };

    setIsSubmitting(true);
    try {
      if (modalMode === "create") {
        const created = await createTask(input);
        setTasks((prev) => {
          const exists = prev.some((task) => task.id === created.id);
          if (exists) {
            return prev.map((task) =>
              task.id === created.id ? created : task,
            );
          }
          return [created, ...prev];
        });
      } else if (selectedTask) {
        const updated = await updateTask(selectedTask.id, input);
        setTasks((prev) =>
          prev.map((task) => (task.id === updated.id ? updated : task)),
        );
      }
      setIsModalOpen(false);
    } catch {
      setFormErrors((prev) => ({
        ...prev,
        title:
          prev.title ??
          "Something went wrong while saving the task. Please try again.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (task: Task) => {
    try {
      await deleteTask(task.id);
      setTasks((prev) => prev.filter((item) => item.id !== task.id));
      if (selectedTask?.id === task.id) {
        setIsModalOpen(false);
      }
    } catch {
      // Soft-fail: could surface toast/error UI in future
    }
  };

  const handleStatusChange = useCallback(
    async (task: Task, status: TaskStatus) => {
      try {
        const updated = await updateTask(task.id, {
          status,
        });
        setTasks((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item)),
        );
      } catch {
        // Soft-fail: avoid breaking UX on single failure
      }
    },
    [],
  );

  const openDeleteConfirm = useCallback((task: Task) => {
    setTaskPendingDelete(task);
    setIsDeleteConfirmOpen(true);
  }, []);

  const handleLogout = useCallback(() => {
    logoutUser();
    router.push("/");
  }, [router]);

  const handleProfileClick = useCallback(() => {
    router.push("/profile");
  }, [router]);

  const profileInitials =
    (authUser?.userName &&
      authUser.userName
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .toUpperCase()) ||
    (authUser?.email?.[0]?.toUpperCase() ?? "U");

  const formatDueLabel = (task: Task): string => {
    if (!task.dueDate) return "No due date";
    const date = new Date(task.dueDate);
    if (Number.isNaN(date.getTime())) return "No due date";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const { activeCount, pendingCount, inProgressCount, completedCount, filteredTasks } =
    useMemo(() => {
      const pending = tasks.filter((task) => task.status === "pending").length;
      const inProgress = tasks.filter(
        (task) => task.status === "in-progress",
      ).length;
      const completed = tasks.filter(
        (task) => task.status === "completed",
      ).length;

      const active = pending + inProgress;

      const normalizedSearch = searchTerm.trim().toLowerCase();

      let tasksForNav = tasks;
      if (activeNavId === "completed") {
        tasksForNav = tasks.filter((task) => task.status === "completed");
      } else if (activeNavId === "in-progress") {
        tasksForNav = tasks.filter((task) => task.status === "in-progress");
      }

      const filtered = tasksForNav.filter((task) => {
        if (!normalizedSearch) return true;
        return (
          task.title.toLowerCase().includes(normalizedSearch) ||
          task.description.toLowerCase().includes(normalizedSearch)
        );
      });

      return {
        activeCount: active,
        pendingCount: pending,
        inProgressCount: inProgress,
        completedCount: completed,
        filteredTasks: filtered,
      };
    }, [activeNavId, searchTerm, tasks]);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside
        className={`hidden border-r border-slate-200 bg-white/80 backdrop-blur-sm transition-all duration-300 ease-in-out md:flex md:flex-col ${isSidebarCollapsed ? "w-20" : "w-64"
          }`}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
              <CheckSquare2 className="h-4 w-4" />
            </div>
            {!isSidebarCollapsed && (
              <div className="leading-tight">
                <p className="text-sm font-semibold text-slate-900">TaskFlow</p>
                <p className="text-[11px] text-slate-400">PWA</p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>

        <nav className="mt-2 flex-1 space-y-1 px-2 py-1 text-sm">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeNavId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveNavId(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 transition-colors ${isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
              >
                <Icon
                  className={`h-4 w-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`}
                />
                {!isSidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 px-4 py-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-700">
              <LogOut className="h-4 w-4" />
            </div>
            {!isSidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white/70 px-4 py-3 backdrop-blur-sm md:px-6">
          <div className="flex items-center gap-3 md:hidden">
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm"
              aria-label="Toggle navigation"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
                <CheckSquare2 className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-slate-900">TaskFlow</p>
                <p className="text-[11px] text-slate-400">PWA</p>
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <span className="text-xs font-medium text-slate-500">Workspace</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              My Tasks
            </span>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1 text-xs text-emerald-600">
              <span
                className={`h-2 w-2 rounded-full ${isRealtimeConnected ? "bg-emerald-500" : "bg-slate-300"
                  }`}
              />
              <span className="font-medium">
                {isRealtimeConnected ? "Synced" : "Connecting"}
              </span>
              <span className="text-slate-400">
                {isRealtimeConnected ? "• Online" : "• Realtime"}
              </span>
            </div>
            <div className="hidden h-8 w-px bg-slate-200 md:block" />
            <button
              type="button"
              onClick={handleProfileClick}
              className="hidden h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white md:flex overflow-hidden"
            >
              {authUser?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={authUser.avatarUrl}
                  alt="Profile"
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                profileInitials
              )}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6">
          <div className="mx-auto flex max-w-5xl flex-col gap-6">
            {/* Page title row */}
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                  My Tasks
                </h1>
                <p className="mt-1 text-xs text-slate-500">
                  {pendingCount} pending, {inProgressCount} in progress,{" "}
                  {completedCount} completed
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  <span className="font-medium text-emerald-700">
                    {completedCount} Done
                  </span>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1">
                  <Circle className="h-3 w-3 text-indigo-500" />
                  <span className="font-medium text-indigo-700">
                    {activeCount} Active
                  </span>
                </div>
              </div>
            </div>

            {/* Search and controls */}
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    placeholder="Search tasks by title or description..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="w-full rounded-full border border-slate-200 bg-white px-9 py-2 text-xs text-slate-800 shadow-sm outline-none ring-0 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700"
                >
                  <SortAsc className="h-3.5 w-3.5" />
                  <span>Sort</span>
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>Filters</span>
                </button>
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700"
                >
                  <span className="text-base leading-none">+</span>
                  <span>New Task</span>
                </button>
              </div>
            </div>

            {/* Tasks list */}
            <section className="space-y-3">
              {!isLoading && !loadError && filteredTasks.length > 0 && (
                <div className="mt-2 hidden items-center justify-between px-1 text-[11px] font-medium text-slate-400 sm:flex">
                  <span className="flex-1 pl-9">Task</span>
                  <div className="flex w-56 justify-end gap-3 pr-1">
                    <span className="w-20 text-right">Status</span>
                    <span className="w-20 text-right">Priority</span>
                    <span className="w-20 text-right">Due date</span>
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="mt-6 rounded-2xl border border-slate-100 bg-white/90 px-6 py-8 text-center text-xs text-slate-500 shadow-sm">
                  Loading your tasks...
                </div>
              )}

              {!isLoading && loadError && (
                <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-6 py-4 text-xs text-red-600">
                  {loadError}
                </div>
              )}

              {!isLoading &&
                !loadError &&
                filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    dueLabel={formatDueLabel(task)}
                    onStatusChange={(item, status) =>
                      void handleStatusChange(item, status)
                    }
                    onOpen={(item) => openEditModal(item)}
                  />
                ))}

              {!isLoading && !loadError && filteredTasks.length === 0 && (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-8 text-center text-xs text-slate-500">
                  No tasks match your current filters. Try adjusting your search
                  or create a new task to get started.
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      <TaskModal
        open={isModalOpen}
        mode={modalMode}
        values={formState}
        errors={formErrors}
        submitting={isSubmitting}
        onFieldChange={handleFormChange}
        onCancel={closeModal}
        onSubmit={handleSubmit}
        onDelete={
          modalMode === "edit" && selectedTask
            ? () => openDeleteConfirm(selectedTask)
            : undefined
        }
      />

      <ConfirmDialog
        open={isDeleteConfirmOpen}
        title="Delete task?"
        description={`Are you sure you want to delete "${taskPendingDelete?.title ?? "this task"
          }"? This action cannot be undone.`}
        confirmLabel="Delete task"
        cancelLabel="Cancel"
        onCancel={() => {
          setIsDeleteConfirmOpen(false);
        }}
        onConfirm={() => {
          if (taskPendingDelete) {
            void handleDeleteTask(taskPendingDelete);
          }
          setIsDeleteConfirmOpen(false);
        }}
      />
    </div>
  );
}

