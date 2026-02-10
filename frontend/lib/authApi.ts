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
}

export interface AuthResponse {
  token: string;
  user?: AuthUser;
}

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

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

