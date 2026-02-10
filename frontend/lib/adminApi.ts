import { apiClient, type ApiTask, mapTaskFromApi, type Task } from "./taskApi";

export interface AdminUser {
  id: string;
  email: string;
  userName?: string;
  role?: string;
  mobile?: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiAdminUser {
  _id: string;
  email: string;
  userName?: string;
  role?: string;
  mobile?: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiTaskWithUser extends ApiTask {
  user?: {
    _id: string;
    email: string;
    userName?: string;
    role?: string;
    mobile?: string;
  };
}

export interface AdminTaskWithUser extends Task {
  user?: {
    id: string;
    email: string;
    userName?: string;
    role?: string;
    mobile?: string;
  };
}

export const fetchAdminUsers = async (): Promise<AdminUser[]> => {
  const response = await apiClient.get<ApiAdminUser[]>("/api/admin/users");

  return response.data.map((user) => ({
    id: user._id,
    email: user.email,
    userName: user.userName,
    role: user.role,
    mobile: user.mobile,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }));
};

export const fetchAdminTasks = async (): Promise<AdminTaskWithUser[]> => {
  const response = await apiClient.get<ApiTaskWithUser[]>("/api/admin/tasks");

  return response.data.map((task) => {
    const base = mapTaskFromApi(task);

    return {
      ...base,
      user: task.user
        ? {
            id: task.user._id,
            email: task.user.email,
            userName: task.user.userName,
            role: task.user.role,
            mobile: task.user.mobile,
          }
        : undefined,
    };
  });
};

