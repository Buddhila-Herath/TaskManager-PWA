import axios from "axios";
import { API_BASE_URL } from "./constants";

export interface RegisterPayload {
  fullName: string;
  email: string;
  mobile: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role?: string;
  userName?: string;
  mobile?: string;
  avatarUrl?: string | null;
}

export interface AuthResponse {
  token: string;
  user?: AuthUser;
}

export interface ProfilePayload {
  email: string;
  userName: string;
  mobile: string;
  avatarUrl?: string | null;
}

export interface UpdateProfilePayload {
  email?: string;
  userName?: string;
  mobile?: string;
  avatarUrl?: string | null;
}

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === "undefined") {
    return {};
  }
  const token = window.localStorage.getItem("authToken");
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

export const registerUser = async (
  payload: RegisterPayload
): Promise<AuthResponse> => {
  const response = await client.post<AuthResponse>("/api/auth/register", {
    email: payload.email.trim(),
    password: payload.password,
    mobile: payload.mobile.trim(),
    userName: payload.fullName.trim(),
  });

  return response.data;
};

export const loginUser = async (
  payload: LoginPayload
): Promise<AuthResponse> => {
  const response = await client.post<AuthResponse>("/api/auth/login", {
    email: payload.email.trim(),
    password: payload.password,
  });

  return response.data;
};

export const fetchProfile = async (): Promise<ProfilePayload & { id: string; role?: string }> => {
  const response = await client.get<AuthUser>("/api/auth/me", {
    headers: getAuthHeaders(),
  });

  const data = response.data;

  return {
    id: data.id,
    email: data.email,
    userName: data.userName ?? "",
    mobile: data.mobile ?? "",
    avatarUrl: data.avatarUrl ?? null,
    role: data.role,
  };
};

export const updateProfile = async (
  payload: UpdateProfilePayload
): Promise<ProfilePayload & { id: string; role?: string }> => {
  const response = await client.put<AuthUser>("/api/auth/me", payload, {
    headers: getAuthHeaders(),
  });

  const data = response.data;

  if (typeof window !== "undefined") {
    window.localStorage.setItem("authUser", JSON.stringify(data));
  }

  return {
    id: data.id,
    email: data.email,
    userName: data.userName ?? "",
    mobile: data.mobile ?? "",
    avatarUrl: data.avatarUrl ?? null,
    role: data.role,
  };
};

export const logoutUser = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem("authToken");
  window.localStorage.removeItem("authUser");
};


