"use client";

import type React from "react";
import type { TaskPriority } from "../../lib/taskApi";

export type ModalMode = "create" | "edit";

export interface TaskFormState {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
}

export interface TaskFormErrors {
  title?: string;
}

interface TaskModalProps {
  open: boolean;
  mode: ModalMode;
  values: TaskFormState;
  errors: TaskFormErrors;
  submitting: boolean;
  onFieldChange: <K extends keyof TaskFormState>(
    key: K,
    value: TaskFormState[K],
  ) => void;
  onCancel: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onDelete?: () => void;
}

export function TaskModal({
  open,
  mode,
  values,
  errors,
  submitting,
  onFieldChange,
  onCancel,
  onSubmit,
  onDelete,
}: TaskModalProps) {
  if (!open) return null;

  const descriptionLength = values.description.length;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 dark:bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl sm:p-7"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {mode === "create" ? "Add Task" : "Edit Task"}
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {mode === "create"
                ? "Create a new task and keep your work organized."
                : "Update task details, adjust priority, or change the due date."}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 transition hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-700 dark:hover:text-slate-300"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="taskTitle"
              className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300"
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
              value={values.title}
              onChange={(event) => onFieldChange("title", event.target.value)}
              className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm outline-none transition focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950 ${errors.title
                  ? "border-red-300 dark:border-red-700 focus:border-red-400 dark:focus:border-red-600"
                  : "border-slate-200 dark:border-slate-700 focus:border-indigo-400 dark:focus:border-indigo-600"
                }`}
              placeholder="Enter a clear task title"
            />
            {errors.title && (
              <p className="mt-1 text-[11px] text-red-500">{errors.title}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="taskDescription"
              className="text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Description
            </label>
            <textarea
              id="taskDescription"
              value={values.description}
              onChange={(event) =>
                onFieldChange("description", event.target.value)
              }
              className="mt-1 h-24 w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 shadow-sm outline-none transition focus:border-indigo-400 dark:focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950"
              placeholder="Add more context, links, or steps for this task"
            />
            <div className="mt-1 flex justify-end text-[10px] text-slate-400">
              {descriptionLength}/500 characters
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="taskPriority"
                className="text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Priority
              </label>
              <div className="mt-1">
                <select
                  id="taskPriority"
                  value={values.priority}
                  onChange={(event) =>
                    onFieldChange("priority", event.target.value as TaskPriority)
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 shadow-sm outline-none transition focus:border-indigo-400 dark:focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950"
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
                className="text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Due Date
              </label>
              <div className="mt-1">
                <input
                  id="taskDueDate"
                  type="date"
                  value={values.dueDate}
                  onChange={(event) =>
                    onFieldChange("dueDate", event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 shadow-sm outline-none transition focus:border-indigo-400 dark:focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950"
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between pt-3">
            {mode === "edit" && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="text-xs font-medium text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300"
              >
                Delete Task
              </button>
            )}
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm transition hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-900 dark:hover:text-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
              >
                {submitting
                  ? mode === "create"
                    ? "Adding..."
                    : "Updating..."
                  : mode === "create"
                    ? "Add Task"
                    : "Update Task"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

