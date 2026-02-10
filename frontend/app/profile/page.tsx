"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProfilePayload } from "../../lib/authApi";
import { fetchProfile, updateProfile } from "../../lib/authApi";
import { DASHBOARD_ROUTE } from "../../lib/constants";

interface FieldErrors {
  [key: string]: string | undefined;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfilePayload>({
    email: "",
    userName: "",
    mobile: "",
    avatarUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const token = window.localStorage.getItem("authToken");
    if (!token) {
      router.replace("/");
      return;
    }

    const load = async () => {
      try {
        const data = await fetchProfile();
        setProfile({
          email: data.email,
          userName: data.userName,
          mobile: data.mobile,
          avatarUrl: data.avatarUrl ?? "",
        });
      } catch (error) {
        setMessageType("error");
        setMessage("Unable to load profile. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [router]);

  const validate = (state: ProfilePayload): FieldErrors => {
    const nextErrors: FieldErrors = {};
    if (!state.userName.trim()) {
      nextErrors.userName = "Name is required.";
    }
    if (!state.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!state.mobile.trim()) {
      nextErrors.mobile = "Mobile number is required.";
    }
    return nextErrors;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setMessageType(null);

    const validationErrors = validate(profile);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        email: profile.email.trim(),
        userName: profile.userName.trim(),
        mobile: profile.mobile.trim(),
        avatarUrl: profile.avatarUrl?.trim() || "",
      });
      setMessageType("success");
      setMessage("Profile updated successfully.");
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "Failed to update profile.";
      setMessageType("error");
      setMessage(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-xs text-slate-500">Loading profile...</p>
      </div>
    );
  }

  const avatarInitials =
    profile.userName
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-slate-50 px-4 py-10">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Profile settings
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              View and manage your account details.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push(DASHBOARD_ROUTE)}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-indigo-200 hover:text-indigo-700"
          >
            Back to tasks
          </button>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-base font-semibold text-indigo-700">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt="Profile"
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              avatarInitials
            )}
          </div>
          <div className="text-xs text-slate-500">
            <p className="font-medium text-slate-800">Profile photo</p>
            <p>Paste an image URL to use as your avatar.</p>
          </div>
        </div>

        {message && (
          <div
            className={`mb-4 rounded-lg px-3 py-2 text-xs ${
              messageType === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="userName"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Full name<span className="text-red-500"> *</span>
            </label>
            <input
              id="userName"
              type="text"
              value={profile.userName}
              onChange={(event) =>
                setProfile((previous) => ({
                  ...previous,
                  userName: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              placeholder="Enter your name"
            />
            {errors.userName && (
              <p className="mt-1 text-xs text-red-500">{errors.userName}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Email address<span className="text-red-500"> *</span>
            </label>
            <input
              id="email"
              type="email"
              value={profile.email}
              onChange={(event) =>
                setProfile((previous) => ({
                  ...previous,
                  email: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="mobile"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Mobile number<span className="text-red-500"> *</span>
            </label>
            <input
              id="mobile"
              type="tel"
              value={profile.mobile}
              onChange={(event) =>
                setProfile((previous) => ({
                  ...previous,
                  mobile: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              placeholder="Enter your mobile number"
            />
            {errors.mobile && (
              <p className="mt-1 text-xs text-red-500">{errors.mobile}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="avatarUrl"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Profile image URL
            </label>
            <input
              id="avatarUrl"
              type="url"
              value={profile.avatarUrl ?? ""}
              onChange={(event) =>
                setProfile((previous) => ({
                  ...previous,
                  avatarUrl: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              placeholder="https://example.com/your-photo.jpg"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-md transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            {saving ? "Saving changes..." : "Save profile"}
          </button>
        </form>
      </div>
    </div>
  );
}

