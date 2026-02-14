"use client";

import { memo } from "react";
import { CheckSquare2, Circle } from "lucide-react";
import type { Task, TaskStatus } from "../../lib/taskApi";

interface TaskCardProps {
  task: Task;
  dueLabel: string;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onOpen: (task: Task) => void;
}

const priorityClasses: Record<Task["priority"], string> = {
  Urgent: "bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400",
  High: "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400",
  Medium: "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400",
  Low: "bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400",
};

const statusSelectClasses: Record<TaskStatus, string> = {
  pending:
    "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800",
  "in-progress":
    "border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 hover:border-sky-300 dark:hover:border-sky-700 hover:bg-sky-100 dark:hover:bg-sky-900",
  completed:
    "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900",
};

const statusLabel: Record<TaskStatus, string> = {
  pending: "Pending",
  "in-progress": "In Progress",
  completed: "Completed",
};

function TaskCardComponent({
  task,
  dueLabel,
  onStatusChange,
  onOpen,
}: TaskCardProps) {
  const isCompleted = task.status === "completed";

  return (
    <article
      className="group cursor-pointer rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-100 dark:hover:border-indigo-900 hover:shadow-md sm:px-5"
      onClick={() => onOpen(task)}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-1 items-start gap-3">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              const nextStatus: TaskStatus =
                task.status === "pending"
                  ? "in-progress"
                  : task.status === "in-progress"
                    ? "completed"
                    : "pending";
              onStatusChange(task, nextStatus);
            }}
            className="mt-0.5 flex h-5 w-5 items-center justify-center rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 transition group-hover:border-indigo-200 dark:group-hover:border-indigo-800 group-hover:text-indigo-500 dark:group-hover:text-indigo-400"
            aria-label="Change task status"
          >
            {isCompleted ? (
              <CheckSquare2 className="h-3.5 w-3.5" />
            ) : (
              <Circle className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpen(task);
            }}
            className="min-w-0 text-left"
          >
            <h2
              className={`truncate text-sm font-semibold ${isCompleted ? "text-slate-400 dark:text-slate-600 line-through" : "text-slate-900 dark:text-slate-100"
                }`}
            >
              {task.title}
            </h2>
            <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
              {task.description}
            </p>
          </button>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap items-center justify-end gap-1.5 text-[11px]">
            <select
              value={task.status}
              onClick={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
              onChange={(event) => {
                event.stopPropagation();
                onStatusChange(task, event.target.value as TaskStatus);
              }}
              className={`cursor-pointer rounded-full border px-2 py-0.5 text-[11px] font-medium outline-none transition ${statusSelectClasses[task.status]}`}
            >
              <option value="pending">{statusLabel.pending}</option>
              <option value="in-progress">{statusLabel["in-progress"]}</option>
              <option value="completed">{statusLabel.completed}</option>
            </select>
            <span
              className={`rounded-full px-2 py-0.5 font-medium ${priorityClasses[task.priority]}`}
            >
              {task.priority}
            </span>
            <span className="rounded-full bg-slate-50 dark:bg-slate-900 px-2 py-0.5 font-medium text-slate-500 dark:text-slate-400">
              {dueLabel}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export const TaskCard = memo(TaskCardComponent);
