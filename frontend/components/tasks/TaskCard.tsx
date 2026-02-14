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
  Urgent: "bg-red-50 text-red-600",
  High: "bg-amber-50 text-amber-600",
  Medium: "bg-indigo-50 text-indigo-600",
  Low: "bg-slate-50 text-slate-500",
};

const statusSelectClasses: Record<TaskStatus, string> = {
  pending:
    "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100",
  "in-progress":
    "border-sky-200 bg-sky-50 text-sky-600 hover:border-sky-300 hover:bg-sky-100",
  completed:
    "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100",
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
      className="group cursor-pointer rounded-2xl border border-slate-100 bg-white/90 px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-md sm:px-5"
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
            className="mt-0.5 flex h-5 w-5 items-center justify-center rounded border border-slate-300 bg-white text-slate-400 transition group-hover:border-indigo-200 group-hover:text-indigo-500"
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
              className={`truncate text-sm font-semibold ${
                isCompleted ? "text-slate-400 line-through" : "text-slate-900"
              }`}
            >
              {task.title}
            </h2>
            <p className="mt-1 line-clamp-2 text-xs text-slate-500">
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
            <span className="rounded-full bg-slate-50 px-2 py-0.5 font-medium text-slate-500">
              {dueLabel}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export const TaskCard = memo(TaskCardComponent);
