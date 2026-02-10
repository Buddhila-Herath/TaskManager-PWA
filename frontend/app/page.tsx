"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser, registerUser } from "../lib/authApi";
import { ADMIN_DASHBOARD_ROUTE, DASHBOARD_ROUTE } from "../lib/constants";

type ActiveTab = "login" | "register";

interface FieldErrors {
  [key: string]: string | undefined;
}

export default function AuthPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>("login");

  const [registerForm, setRegisterForm] = useState({
    fullName: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [registerErrors, setRegisterErrors] = useState<FieldErrors>({});
  const [loginErrors, setLoginErrors] = useState<FieldErrors>({});

  const [registerLoading, setRegisterLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [globalMessage, setGlobalMessage] = useState<string | null>(null);
  const [globalMessageType, setGlobalMessageType] = useState<
    "success" | "error" | null
  >(null);

  const resetMessages = () => {
    setGlobalMessage(null);
    setGlobalMessageType(null);
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateRegister = () => {
    const errors: FieldErrors = {};

    if (!registerForm.fullName.trim()) {
      errors.fullName = "Full name is required.";
    }
    if (!registerForm.email.trim()) {
      errors.email = "Email is required.";
    } else if (!validateEmail(registerForm.email.trim())) {
      errors.email = "Please enter a valid email address.";
    }
    if (!registerForm.mobile.trim()) {
      errors.mobile = "Mobile number is required.";
    } else if (!/^\d{9,15}$/.test(registerForm.mobile.trim())) {
      errors.mobile = "Enter a valid mobile number.";
    }
    if (!registerForm.password) {
      errors.password = "Password is required.";
    } else if (registerForm.password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }
    if (!registerForm.confirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (registerForm.password !== registerForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }
    if (!registerForm.acceptTerms) {
      errors.acceptTerms = "You must agree to the terms.";
    }

    setRegisterErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateLogin = () => {
    const errors: FieldErrors = {};

    if (!loginForm.email.trim()) {
      errors.email = "Email is required.";
    } else if (!validateEmail(loginForm.email.trim())) {
      errors.email = "Please enter a valid email address.";
    }
    if (!loginForm.password) {
      errors.password = "Password is required.";
    }

    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegisterSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    resetMessages();

    if (!validateRegister()) {
      return;
    }

    setRegisterLoading(true);
    try {
      const response = await registerUser({
        fullName: registerForm.fullName,
        email: registerForm.email,
        mobile: registerForm.mobile,
        password: registerForm.password,
      });

      if (response.token) {
        if (typeof window !== "undefined") {
          localStorage.setItem("authToken", response.token);
          if (response.user) {
            localStorage.setItem("authUser", JSON.stringify(response.user));
          }
        }
      }

      setGlobalMessageType("success");
      setGlobalMessage("Account created successfully. You can now log in.");
      setActiveTab("login");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Registration failed. Please try again.";
      setGlobalMessageType("error");
      setGlobalMessage(message);
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    resetMessages();

    if (!validateLogin()) {
      return;
    }

    setLoginLoading(true);
    try {
      const response = await loginUser({
        email: loginForm.email,
        password: loginForm.password,
      });

      if (response.token) {
        if (typeof window !== "undefined") {
          localStorage.setItem("authToken", response.token);
          if (response.user) {
            localStorage.setItem("authUser", JSON.stringify(response.user));
          }
        }
        const role = response.user?.role;
        const targetRoute =
          role === "admin" ? ADMIN_DASHBOARD_ROUTE : DASHBOARD_ROUTE;
        router.push(targetRoute);
      }

      setGlobalMessageType("success");
      setGlobalMessage("Login successful.");
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Login failed. Please try again.";
      setGlobalMessageType("error");
      setGlobalMessage(message);
    } finally {
      setLoginLoading(false);
    }
  };

  const tabClass = (tab: ActiveTab) =>
    [
      "w-1/2 pb-3 text-center text-sm font-medium cursor-pointer border-b-2 transition-colors",
      activeTab === tab
        ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
        : "border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300",
    ].join(" ");

  const labelClass = "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1";
  const inputClass =
    "w-full rounded-lg border border-black-600 dark:border-slate-700 px-3 py-2 text-sm shadow-sm focus:border-black-700 dark:focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-black-700 dark:focus:ring-indigo-600 text-gray-800 dark:text-slate-200 bg-white dark:bg-slate-800 placeholder-gray-400 dark:placeholder-slate-500";
  const errorTextClass = "mt-1 text-xs text-red-500";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-xl ring-1 ring-black/5 dark:ring-white/5">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
            <span className="text-xl">✓</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-slate-100">TaskFlow</h1>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
            Real-time task management for busy professionals
          </p>
        </div>

        <div className="mb-6 flex border-b border-gray-200 dark:border-slate-700 text-sm">
          <button
            type="button"
            className={tabClass("login")}
            onClick={() => {
              resetMessages();
              setActiveTab("login");
            }}
          >
            Login
          </button>
          <button
            type="button"
            className={tabClass("register")}
            onClick={() => {
              resetMessages();
              setActiveTab("register");
            }}
          >
            Register
          </button>
        </div>

        {globalMessage && (
          <div
            className={`mb-4 rounded-lg px-3 py-2 text-xs ${globalMessageType === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
              }`}
          >
            {globalMessage}
          </div>
        )}

        {activeTab === "register" ? (
          <form className="space-y-4" onSubmit={handleRegisterSubmit}>
            <div>
              <label className={labelClass} htmlFor="fullName">
                Full Namefd<span className="text-red-500"> *</span>
              </label>
              <input
                id="fullName"
                type="text"
                className={inputClass}
                placeholder="Enter your full name"
                value={registerForm.fullName}
                onChange={(e) =>
                  setRegisterForm((prev) => ({
                    ...prev,
                    fullName: e.target.value,
                  }))
                }
              />
              {registerErrors.fullName && (
                <p className={errorTextClass}>{registerErrors.fullName}</p>
              )}
            </div>

            <div>
              <label className={labelClass} htmlFor="email">
                Email Addressdd<span className="text-red-500"> *</span>
              </label>
              <input
                id="email"
                type="email"
                className={inputClass}
                placeholder="Enter your email"
                value={registerForm.email}
                onChange={(e) =>
                  setRegisterForm((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
              />
              {registerErrors.email && (
                <p className={errorTextClass}>{registerErrors.email}</p>
              )}
            </div>

            <div>
              <label className={labelClass} htmlFor="mobile">
                Mobile Number<span className="text-red-500"> *</span>
              </label>
              <input
                id="mobile"
                type="tel"
                className={inputClass}
                placeholder="Enter your mobile number"
                value={registerForm.mobile}
                onChange={(e) =>
                  setRegisterForm((prev) => ({
                    ...prev,
                    mobile: e.target.value,
                  }))
                }
              />
              {registerErrors.mobile && (
                <p className={errorTextClass}>{registerErrors.mobile}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="password">
                  Password<span className="text-red-500"> *</span>
                </label>
                <input
                  id="password"
                  type="password"
                  className={inputClass}
                  placeholder="Create a strong password"
                  value={registerForm.password}
                  onChange={(e) =>
                    setRegisterForm((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                />
                {registerErrors.password && (
                  <p className={errorTextClass}>{registerErrors.password}</p>
                )}
              </div>

              <div>
                <label className={labelClass} htmlFor="confirmPassword">
                  Confirm Password<span className="text-red-500"> *</span>
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  className={inputClass}
                  placeholder="Re-enter your password"
                  value={registerForm.confirmPassword}
                  onChange={(e) =>
                    setRegisterForm((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                />
                {registerErrors.confirmPassword && (
                  <p className={errorTextClass}>
                    {registerErrors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2">
              <input
                id="acceptTerms"
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                checked={registerForm.acceptTerms}
                onChange={(e) =>
                  setRegisterForm((prev) => ({
                    ...prev,
                    acceptTerms: e.target.checked,
                  }))
                }
              />
              <label
                htmlFor="acceptTerms"
                className="text-xs text-gray-500 leading-snug"
              >
                I agree to{" "}
                <span className="font-medium text-indigo-600">
                  Terms of Service
                </span>{" "}
                and{" "}
                <span className="font-medium text-indigo-600">
                  Privacy Policy
                </span>
                .
              </label>
            </div>
            {registerErrors.acceptTerms && (
              <p className={errorTextClass}>{registerErrors.acceptTerms}</p>
            )}

            <button
              type="submit"
              disabled={registerLoading}
              className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white shadow-md transition hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              {registerLoading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleLoginSubmit}>
            <div>
              <label className={labelClass} htmlFor="loginEmail">
                Email Addressdd<span className="text-red-500"> *</span>
              </label>
              <input
                id="loginEmail"
                type="email"
                className={inputClass}
                placeholder="Enter your email"
                value={loginForm.email}
                onChange={(e) =>
                  setLoginForm((prev) => ({ ...prev, email: e.target.value }))
                }
              />
              {loginErrors.email && (
                <p className={errorTextClass}>{loginErrors.email}</p>
              )}
            </div>

            <div>
              <label className={labelClass} htmlFor="loginPassword">
                Password<span className="text-red-500"> *</span>
              </label>
              <input
                id="loginPassword"
                type="password"
                className={inputClass}
                placeholder="Enter your password"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
              />
              {loginErrors.password && (
                <p className={errorTextClass}>{loginErrors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-gray-500">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                Remember me
              </label>
              <button
                type="button"
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white shadow-md transition hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              {loginLoading ? "Logging in..." : "Login to Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

