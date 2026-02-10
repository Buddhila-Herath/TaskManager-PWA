"use client";

import { useMemo, useState } from "react";
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

type TaskStatus = "pending" | "completed";

type TaskPriority = "Low" | "Medium" | "High" | "Urgent";

interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueLabel: string;
  statusLabel: string;
}

const NAV_ITEMS = [
  { id: "my-tasks", label: "My Tasks", icon: LayoutList },
  { id: "completed", label: "Completed", icon: CheckCircle2 },
  { id: "profile", label: "Profile", icon: User2 },
] as const;

const SAMPLE_TASKS: Task[] = [
  {
    id: 1,
    title: "Code Review for Feature Branch",
    description:
      "Review pull request for the new authentication module and provide detailed feedback on implementation.",
    status: "pending",
    statusLabel: "Pending",
    priority: "High",
    dueLabel: "Feb 11",
  },
  {
    id: 2,
    title: "Complete Q1 Financial Report",
    description:
      "Prepare comprehensive financial analysis including revenue breakdown, expense tracking, and quarterly projections for stakeholder presentation.",
    status: "pending",
    statusLabel: "Pending",
    priority: "Urgent",
    dueLabel: "Feb 15",
  },
  {
    id: 3,
    title: "Review Client Proposal Documents",
    description:
      "Analyze and provide feedback on the new client proposal for the enterprise software implementation project.",
    status: "pending",
    statusLabel: "Pending",
    priority: "High",
    dueLabel: "Feb 12",
  },
  {
    id: 4,
    title: "Team Meeting Preparation",
    description:
      "Prepare agenda, gather metrics, and create presentation slides for the weekly team sync meeting.",
    status: "completed",
    statusLabel: "Completed",
    priority: "Medium",
    dueLabel: "Feb 10",
  },
];

export default function DashboardPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeNavId, setActiveNavId] = useState<(typeof NAV_ITEMS)[number]["id"]>(
    "my-tasks",
  );
  const [searchTerm, setSearchTerm] = useState("");

  const { activeCount, completedCount, filteredTasks } = useMemo(() => {
    const active = SAMPLE_TASKS.filter((task) => task.status === "pending").length;
    const completed = SAMPLE_TASKS.filter(
      (task) => task.status === "completed",
    ).length;

    const normalizedSearch = searchTerm.trim().toLowerCase();

    const tasksForNav =
      activeNavId === "completed"
        ? SAMPLE_TASKS.filter((task) => task.status === "completed")
        : SAMPLE_TASKS;

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
  }, [activeNavId, searchTerm]);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside
        className={`hidden border-r border-slate-200 bg-white/80 backdrop-blur-sm transition-all duration-300 ease-in-out md:flex md:flex-col ${
          isSidebarCollapsed ? "w-20" : "w-64"
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
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                  isActive
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
              </div>
            </div>

            {/* Tasks list */}
            <section className="space-y-3">
              {filteredTasks.map((task) => (
                <article
                  key={task.id}
                  className="group rounded-2xl border border-slate-100 bg-white/90 px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-md sm:px-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-1 items-start gap-3">
                      <button
                        type="button"
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
                          className={`truncate text-sm font-semibold ${
                            task.status === "completed"
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
                          className={`rounded-full px-2 py-0.5 font-medium ${
                            task.status === "completed"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-50 text-slate-600"
                          }`}
                        >
                          {task.statusLabel}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 font-medium ${
                            task.priority === "Urgent"
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
                          {task.dueLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}

              {filteredTasks.length === 0 && (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-8 text-center text-xs text-slate-500">
                  No tasks match your current filters. Try adjusting your search.
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

