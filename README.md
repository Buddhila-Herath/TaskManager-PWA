# Task Manager PWA

A **Real-Time Task Management Progressive Web Application (PWA)** with instant sync across devices, WebSocket updates, push notifications, and offline-capable installability.

---

## Table of Contents

- [Overview](#overview)
- [Setup Instructions](#setup-instructions)
- [Default admin credentials](#6-default-admin-credentials)
- [Tech Stack](#tech-stack)
- [WebSocket & Notifications](#websocket--notifications)
- [Environment Configuration (.env)](#environment-configuration-env)
- [Evaluation Notes](#evaluation-notes)

---

## Overview

The application lets users **register**, **log in**, and manage tasks (create, update, delete, filter by status). Changes are reflected in **real time** via WebSocket and optionally via **push notifications**. The frontend is a **PWA** (service worker + manifest) so it can be installed and used offline where supported.

**Main features:**

- **Auth:** JWT-based login/register; passwords hashed with bcrypt; protected task APIs.
- **Tasks:** CRUD with title, description, status (Pending / In Progress / Completed), priority, due date.
- **Real time:** Socket.IO broadcasts task create/update/delete to the owning user.
- **Push:** Web Push (VAPID) for task created/updated/completed/deleted and due-date reminders.
- **PWA:** Manifest, icons, service worker for installability and caching.

---

## Setup Instructions

### Prerequisites

- **Node.js** (v18+)
- **npm** (or yarn/pnpm)
- **MongoDB** (local or Docker)

### 1. Clone and install

```bash
git clone <repository-url>
cd "PWA Application"
```

### 2. Environment files

Create env files from the examples so the examiner can run the app without guessing values.

**Backend**

```bash
cd backend
cp .env.example .env
# Edit .env and set at least JWT_SECRET (and MONGODB_URI if not using default)
```

**Frontend**

```bash
cd frontend
cp .env.example .env
# Edit .env if you need to change API or WebSocket URL (optional)
```

See [Environment Configuration (.env)](#environment-configuration-env) for required and optional variables.

### 3. Run with Docker (recommended for examiners)

From the **project root**:

```bash
docker-compose up --build
```

- **Frontend:** http://localhost:3000  
- **Backend API:** http://localhost:5002  
- **MongoDB:** localhost:27017 (internal to Docker)

Backend expects `backend/.env` (create from `backend/.env.example`). Ensure `JWT_SECRET` is set.

### 4. Run without Docker (local dev)

**Terminal 1 – MongoDB**  
Have MongoDB running on `localhost:27017` (or set `MONGODB_URI` in `backend/.env`).

**Terminal 2 – Backend**

```bash
cd backend
npm install
npm run dev
```

Runs on **http://localhost:5000** by default (or `PORT` from `.env`). If you use 5002, set `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_WS_URL` in frontend accordingly.

**Terminal 3 – Frontend**

```bash
cd frontend
npm install
npm run dev
```

Runs on **http://localhost:3000**.

### 5. Quick test

1. Open http://localhost:3000 (or 3000 if using Docker).
2. Register a user, then log in.
3. Create/edit/delete tasks; list updates in real time.
4. Optional: enable push (browser prompt) for notifications.

### 6. Default admin credentials

| Field    | Value             |
|----------|-------------------|
| **Username (email)** | `admin@gmail.com` |
| **Password**         | `123456`          |

Use these to log in as admin for admin-only routes and features.

---

## Tech Stack

| Layer      | Technologies |
|-----------|---------------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Socket.IO client, next-pwa |
| **Backend**  | Node.js, Express 5, Mongoose, Socket.IO, JWT, bcryptjs, web-push (VAPID) |
| **Database** | MongoDB |
| **Real time** | Socket.IO (WebSocket) |
| **Push**   | Web Push API, VAPID (web-push) |
| **PWA**    | next-pwa, manifest.json, service worker, 192×192 & 512×512 icons |
| **DevOps** | Docker, docker-compose |

---

## WebSocket & Notifications

### WebSocket (Socket.IO)

- **Purpose:** Real-time task updates so the UI updates without refresh when tasks are created, updated, or deleted.
- **Flow:**
  1. Frontend connects to the backend Socket.IO server (same origin as API, or `NEXT_PUBLIC_WS_URL`).
  2. After connect, client sends `authenticate` with the JWT.
  3. Backend verifies JWT and joins the socket to a **user room** `user:<userId>`.
  4. On task create/update/delete, the backend emits to that room:
     - `task_created` (full task)
     - `task_updated` (full task)
     - `task_deleted` (payload `{ id }`)
  5. Frontend listens for these events and updates local state (add/update/remove task in the list).
- **Auth:** Only authenticated sockets receive task events; invalid tokens get `auth_error` and the client disconnects.

### Push Notifications

- **Purpose:** Notify the user when tasks change or when a task is due, even if the tab is in the background or closed (when the browser supports it).
- **Flow:**
  1. Frontend asks for notification permission and gets a push subscription (browser + service worker).
  2. Frontend sends the subscription to `POST /api/push/subscribe` (with JWT). Backend stores it per user (PushSubscription model).
  3. On task create/update/delete (and when marking completed), backend calls `sendPushToUser(userId, payload)` (fire-and-forget).
  4. **Due-date reminders:** A scheduler runs on an interval, finds tasks with `dueDate` within the next N minutes and `reminderSent !== true`, sends a “Task due soon” push, then sets `reminderSent = true`.
- **Requirements:** Backend needs VAPID keys (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`); frontend needs `NEXT_PUBLIC_VAPID_PUBLIC_KEY`. Without them, push is skipped; the rest of the app still works.

---

## Environment Configuration (.env)

Examiners should **copy `.env.example` to `.env`** in both `backend` and `frontend`, then set the values below.

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | **Yes** | Secret used to sign/verify JWT tokens. Use a long random string. |
| `MONGODB_URI` | No | Default: `mongodb://localhost:27017/taskmanager`. With Docker: `mongodb://mongo:27017/taskmanager`. |
| `PORT` | No | Server port. Default: 5000. Docker Compose uses 5002. |
| `FRONTEND_URL` | No | CORS and Socket.IO origin. Default: `http://localhost:3000`. |
| `VAPID_PUBLIC_KEY` | No | Web Push VAPID public key (push works only if set). |
| `VAPID_PRIVATE_KEY` | No | Web Push VAPID private key. |
| `VAPID_SUBJECT` | No | e.g. `mailto:admin@example.com`. |
| `TASK_REMINDER_LEAD_MINUTES` | No | Minutes before due date to send reminder. Default: 60. |
| `TASK_REMINDER_POLL_MS` | No | Reminder poll interval in ms. Default: 60000. |

**Minimal backend `.env` to run (no push):**

```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
MONGODB_URI=mongodb://localhost:27017/taskmanager
PORT=5002
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | No | Backend API base URL. Default: `http://localhost:5002`. |
| `NEXT_PUBLIC_WS_URL` | No | Socket.IO server URL. Default: same as `NEXT_PUBLIC_API_BASE_URL`. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | No | Same as backend `VAPID_PUBLIC_KEY` (needed for push). |

**Minimal frontend `.env` (match backend port):**

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5002
NEXT_PUBLIC_WS_URL=http://localhost:5002
```

**For examiners – how to run the project:**

1. **Create env files from the examples (no real secrets in repo):**
   - `backend/.env.example` → copy to `backend/.env`
   - `frontend/.env.example` → copy to `frontend/.env`
2. In `backend/.env`, set `JWT_SECRET` to any long random string (e.g. `exam-jwt-secret-key-123`). Leave other vars as in the example unless you need custom MongoDB or port.
3. From the **project root**, run: `docker-compose up --build`
4. Open **http://localhost:3000** and register/login to use the app. API is at **http://localhost:5002**.

Alternatively, run backend and frontend manually (see [Setup Instructions](#setup-instructions)); ensure MongoDB is running and ports match the URLs in `.env`.

---

## Evaluation Notes

| Area | What This Project Provides |
|------|-----------------------------|
| **Code quality** | Structured modules (controllers, routes, middleware, models), clear naming, validation on inputs, centralised env and constants. |
| **Backend logic** | RESTful task CRUD, auth and push routes, validation (e.g. task title required, status/priority enums), 401/404/500 handling. |
| **Auth** | Registration/login with bcrypt hashing; JWT in `Authorization: Bearer <token>`; `protect` middleware on task and push routes; role-based admin routes. |
| **WebSocket** | Socket.IO with JWT-based room join; real-time `task_created` / `task_updated` / `task_deleted` to the owning user only. |
| **PWA** | Service worker (next-pwa), web app manifest (name, icons 192/512, display standalone), installable in supported browsers. |
| **Git** | Meaningful commits expected; see repository history. |
| **Problem solving** | Push optional when VAPID not set; MongoDB connection failure logged but server still starts; sensible trade-offs between features and complexity. |

For API usage and sample requests, see **API_USAGE.md**. For PWA installability and testing, see **PWA_TESTING.md**.
