# Task Manager – Backend

Node.js + Express API for the Task Manager PWA: auth, task CRUD, WebSocket (Socket.IO), and Web Push notifications.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express 5
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT (jsonwebtoken), bcryptjs
- **Real time:** Socket.IO
- **Push:** web-push (VAPID)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set at least:

   - `JWT_SECRET` – required for auth

   Optional: `MONGODB_URI`, `PORT`, `FRONTEND_URL`, and VAPID keys for push (see root README).

3. **MongoDB**

   Ensure MongoDB is running (local or Docker). Default URI: `mongodb://localhost:27017/taskmanager`.

## Run

- **Development (nodemon):** `npm run dev`
- **Production:** `npm start` (runs `node server.js`)
- **Tests:** `npm test`

Default port: 5000 (or `PORT` from `.env`). With Docker Compose the app often runs on 5002.

## Default admin credentials

| Field    | Value             |
|----------|-------------------|
| **Username (email)** | `admin@gmail.com` |
| **Password**         | `123456`          |

Use these to authenticate for admin-only routes under `/api/admin`.

## API Overview

| Area | Routes |
|------|--------|
| **Auth** | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/user` (protected) |
| **Tasks** | `GET/POST /api/tasks`, `PUT/DELETE /api/tasks/:id` (all protected) |
| **Push** | `POST /api/push/subscribe`, `DELETE /api/push/unsubscribe` (protected) |
| **Admin** | Admin-only routes under `/api/admin` |
| **Health** | `GET /health` – returns `{ status: 'ok' }` |

All task and push routes require header: `Authorization: Bearer <JWT>`.

For detailed request/response examples and sample bodies, see the root **API_USAGE.md**.

## Project Structure

- `server.js` – Express app, Socket.IO, MongoDB connect, route mounting
- `controllers/` – auth, task, admin logic
- `routes/` – auth, task, push, admin routes
- `middleware/authMiddleware.js` – JWT `protect` and role-based `authorizeRoles`
- `models/` – User, Task, PushSubscription
- `utils/` – pushService (web-push), reminderScheduler (due-date reminders)

## WebSocket (Socket.IO)

- Clients connect and send `authenticate` with JWT.
- Server verifies JWT and joins the socket to room `user:<userId>`.
- Task controller emits `task_created`, `task_updated`, `task_deleted` to that room so the frontend can update the list in real time.

## Push Notifications

- Subscriptions are stored in `PushSubscription` (per user/endpoint).
- On task create/update/delete (and when a task is marked completed), the backend sends a Web Push to that user (if VAPID keys are set).
- `reminderScheduler` runs on an interval and sends “Task due soon” for tasks with a due date in the configured lead window.
