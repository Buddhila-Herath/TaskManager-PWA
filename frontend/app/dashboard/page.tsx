"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  CheckSquare2,
  Circle,
  LayoutList,
  Menu,
  Search,
  SortAsc,
  User2,
} from "lucide-react";
import {
  Task,
  TaskPriority,
  TaskStatus,
  TaskInput,
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../../lib/taskApi";

const NAV_ITEMS = [
  { id: "my-tasks", label: "My Tasks", icon: LayoutList },
  { id: "completed", label: "Completed", icon: CheckCircle2 },
] as const;

type ModalMode = "create" | "edit";

interface TaskFormState {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
}

interface TaskFormErrors {
  title?: string;
}

export default function DashboardPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeNavId, setActiveNavId] = useState<(typeof NAV_ITEMS)[number]["id"]>(
    "my-tasks",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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

  useEffect(() => {
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
  }, []);

  const openCreateModal = () => {
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
  };

  const openEditModal = (task: Task) => {
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
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const validateForm = (state: TaskFormState): TaskFormErrors => {
    const errors: TaskFormErrors = {};
    if (!state.title.trim()) {
      errors.title = "Task title is required.";
    }
    return errors;
  };

  const handleFormChange = <K extends keyof TaskFormState>(
    key: K,
    value: TaskFormState[K],
  ) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => ({ ...prev, [key]: undefined }));
  };

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
        setTasks((prev) => [created, ...prev]);
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
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this task?",
    );
    if (!confirmDelete) return;

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

  const handleToggleStatus = async (task: Task) => {
    const nextStatus: TaskStatus =
      task.status === "completed" ? "pending" : "completed";
    try {
      const updated = await updateTask(task.id, {
        status: nextStatus,
        title: ""
      });
      setTasks((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch {
      // Soft-fail: avoid breaking UX on single failure
    }
  };

  const formatDueLabel = (task: Task): string => {
    if (!task.dueDate) return "No due date";
    const date = new Date(task.dueDate);
    if (Number.isNaN(date.getTime())) return "No due date";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const statusLabelFor = (status: TaskStatus): string =>
    status === "completed" ? "Completed" : "Pending";

  const { activeCount, completedCount, filteredTasks } = useMemo(() => {
    const active = tasks.filter((task) => task.status === "pending").length;
    const completed = tasks.filter((task) => task.status === "completed").length;

    const normalizedSearch = searchTerm.trim().toLowerCase();

    const tasksForNav =
      activeNavId === "completed"
        ? tasks.filter((task) => task.status === "completed")
        : tasks;

    const filtered = tasksForNav.filter((task) => {
      if (!normalizedSearch) return true;
      return (
        task.title.toLowerCase().includes(normalizedSearch) ||
        task.description.toLowerCase().includes(normalizedSearch)
      );
    });

    return {
      activeCount: active,
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
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
              TF
            </div>
            {!isSidebarCollapsed && (
              <div>
                <p className="text-xs font-medium text-slate-800">Alex Johnson</p>
                <p className="text-[11px] text-slate-400">Product Manager</p>
              </div>
            )}
          </div>
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
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-medium">Synced</span>
              <span className="text-slate-400">• Online</span>
            </div>
            <div className="hidden h-8 w-px bg-slate-200 md:block" />
            <div className="hidden items-center gap-3 md:flex">
              <button
                type="button"
                className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
              >
                Feedback
              </button>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                AJ
              </div>
            </div>
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
                  {activeCount} active, {completedCount} completed
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
                  <article
                    key={task.id}
                    className="group cursor-pointer rounded-2xl border border-slate-100 bg-white/90 px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-md sm:px-5"
                    onClick={() => openEditModal(task)}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex flex-1 items-start gap-3">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleToggleStatus(task);
                          }}
                          className="mt-0.5 flex h-5 w-5 items-center justify-center rounded border border-slate-300 bg-white text-slate-400 transition group-hover:border-indigo-200 group-hover:text-indigo-500"
                          aria-label={
                            task.status === "completed"
                              ? "Mark task as pending"
                              : "Mark task as completed"
                          }
                        >
                          {task.status === "completed" ? (
                            <CheckSquare2 className="h-3.5 w-3.5" />
                          ) : (
                            <Circle className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <h2
                            className={`truncate text-sm font-semibold ${task.status === "completed"
                              ? "text-slate-400 line-through"
                              : "text-slate-900"
                              }`}
                          >
                            {task.title}
                          </h2>
                          <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                            {task.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="flex flex-wrap items-center justify-end gap-1.5 text-[11px]">
                          <span
                            className={`rounded-full px-2 py-0.5 font-medium ${task.status === "completed"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-50 text-slate-600"
                              }`}
                          >
                            {statusLabelFor(task.status)}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 font-medium ${task.priority === "Urgent"
                              ? "bg-red-50 text-red-600"
                              : task.priority === "High"
                                ? "bg-amber-50 text-amber-600"
                                : task.priority === "Medium"
                                  ? "bg-indigo-50 text-indigo-600"
                                  : "bg-slate-50 text-slate-500"
                              }`}
                          >
                            {task.priority}
                          </span>
                          <span className="rounded-full bg-slate-50 px-2 py-0.5 font-medium text-slate-500">
                            {formatDueLabel(task)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
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

      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 px-4 py-6 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl sm:p-7"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {modalMode === "create" ? "Add Task" : "Edit Task"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {modalMode === "create"
                    ? "Create a new task and keep your work organized."
                    : "Update task details, adjust priority, or change the due date."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="taskTitle"
                  className="flex items-center justify-between text-xs font-medium text-slate-700"
                >
                  <span>
                    Task Title <span className="text-red-500">*</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Keep it short and descriptive
                  </span>
                </label>
                <input
                  id="taskTitle"
                  type="text"
                  value={formState.title}
                  onChange={(event) =>
                    handleFormChange("title", event.target.value)
                  }
                  className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-indigo-100 ${formErrors.title
                    ? "border-red-300 focus:border-red-400"
                    : "border-slate-200 focus:border-indigo-400"
                    }`}
                  placeholder="Enter a clear task title"
                />
                {formErrors.title && (
                  <p className="mt-1 text-[11px] text-red-500">
                    {formErrors.title}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="taskDescription"
                  className="text-xs font-medium text-slate-700"
                >
                  Description
                </label>
                <textarea
                  id="taskDescription"
                  value={formState.description}
                  onChange={(event) =>
                    handleFormChange("description", event.target.value)
                  }
                  className="mt-1 h-24 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  placeholder="Add more context, links, or steps for this task"
                />
                <div className="mt-1 flex justify-end text-[10px] text-slate-400">
                  {formState.description.length}/500 characters
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="taskPriority"
                    className="text-xs font-medium text-slate-700"
                  >
                    Priority
                  </label>
                  <div className="mt-1">
                    <select
                      id="taskPriority"
                      value={formState.priority}
                      onChange={(event) =>
                        handleFormChange(
                          "priority",
                          event.target.value as TaskPriority,
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="Low">Low Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="High">High Priority</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="taskDueDate"
                    className="text-xs font-medium text-slate-700"
                  >
                    Due Date
                  </label>
                  <div className="mt-1">
                    <input
                      id="taskDueDate"
                      type="date"
                      value={formState.dueDate}
                      onChange={(event) =>
                        handleFormChange("dueDate", event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between pt-3">
                {modalMode === "edit" && selectedTask && (
                  <button
                    type="button"
                    onClick={() => void handleDeleteTask(selectedTask)}
                    className="text-xs font-medium text-red-500 hover:text-red-600"
                  >
                    Delete Task
                  </button>
                )}
                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                  >
                    {isSubmitting
                      ? modalMode === "create"
                        ? "Adding..."
                        : "Updating..."
                      : modalMode === "create"
                        ? "Add Task"
                        : "Update Task"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

