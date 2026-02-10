import axios, { AxiosRequestConfig } from "axios";
import { API_BASE_URL } from "./constants";

export type TaskStatus = "pending" | "in-progress" | "completed";
export type TaskPriority = "Low" | "Medium" | "High" | "Urgent";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

type ApiTaskStatus = "Pending" | "In Progress" | "Completed";

interface ApiTask {
  _id: string;
  title: string;
  description?: string;
  status: ApiTaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
}

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

client.interceptors.request.use((config: AxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("authToken");
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  }
  return config;
});

const mapStatusFromApi = (status: ApiTaskStatus): TaskStatus => {
  if (status === "Completed") return "completed";
  if (status === "In Progress") return "in-progress";
  return "pending";
};

const mapStatusToApi = (status?: TaskStatus): ApiTaskStatus | undefined => {
  if (!status) return undefined;
  if (status === "completed") return "Completed";
  if (status === "in-progress") return "In Progress";
  return "Pending";
};

const mapTaskFromApi = (task: ApiTask): Task => ({
  id: task._id,
  title: task.title,
  description: task.description ?? "",
  status: mapStatusFromApi(task.status),
  priority: task.priority ?? "Medium",
  dueDate: task.dueDate ?? null,
  createdAt: task.createdAt,
  updatedAt: task.updatedAt,
});

export const fetchTasks = async (): Promise<Task[]> => {
  const response = await client.get<ApiTask[]>("/api/tasks");
  return response.data.map(mapTaskFromApi);
};

export const createTask = async (input: TaskInput): Promise<Task> => {
  const payload: Record<string, unknown> = {
    title: input.title,
  };

  if (input.description !== undefined) {
    payload.description = input.description;
  }
  const apiStatus = mapStatusToApi(input.status);
  if (apiStatus) {
    payload.status = apiStatus;
  }
  if (input.priority) {
    payload.priority = input.priority;
  }
  if (input.dueDate) {
    payload.dueDate = input.dueDate;
  }

  const response = await client.post<ApiTask>("/api/tasks", payload);
  return mapTaskFromApi(response.data);
};

export const updateTask = async (
  id: string,
  input: TaskInput
): Promise<Task> => {
  const payload: Record<string, unknown> = {};

  if (input.title !== undefined) {
    payload.title = input.title;
  }
  if (input.description !== undefined) {
    payload.description = input.description;
  }
  const apiStatus = mapStatusToApi(input.status);
  if (apiStatus) {
    payload.status = apiStatus;
  }
  if (input.priority) {
    payload.priority = input.priority;
  }
  if (input.dueDate !== undefined) {
    payload.dueDate = input.dueDate;
  }

  const response = await client.put<ApiTask>(`/api/tasks/${id}`, payload);
  return mapTaskFromApi(response.data);
};

export const deleteTask = async (id: string): Promise<void> => {
  await client.delete(`/api/tasks/${id}`);
};

