import { jest, describe, test, expect } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import { TaskCard } from "../components/tasks/TaskCard";
import type { Task, TaskStatus } from "../lib/taskApi";

const createTask = (overrides?: Partial<Task>): Task => ({
  id: "1",
  title: "Test task",
  description: "Test description",
  priority: "High",
  status: "pending" as TaskStatus,
  dueDate: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe("TaskCard", () => {
  test("renders task title and description", () => {
    const task = createTask();
    render(
      <TaskCard
        task={task}
        dueLabel="Due soon"
        onStatusChange={jest.fn()}
        onOpen={jest.fn()}
      />,
    );

    expect(screen.getByText("Test task")).toBeTruthy();
    expect(screen.getByText("Test description")).toBeTruthy();
    expect(screen.getByText("Due soon")).toBeTruthy();
  });

  test("calls onStatusChange when checkbox is clicked", () => {
    const task = createTask({ status: "pending" as TaskStatus });
    const onStatusChange = jest.fn();

    render(
      <TaskCard
        task={task}
        dueLabel="Due soon"
        onStatusChange={onStatusChange}
        onOpen={jest.fn()}
      />,
    );

    const button = screen.getByRole("button", { name: "Change task status" });
    fireEvent.click(button);

    expect(onStatusChange).toHaveBeenCalledTimes(1);
    expect(onStatusChange).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Test task" }),
      "in-progress",
    );
  });
});

