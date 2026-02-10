# API Usage & Testing Guide

Base URL: `http://localhost:5002`

---

## Implementation summary (backend)

| Requirement | Status |
|-------------|--------|
| User registration & login | Done |
| JWT auth | Done |
| Passwords hashed (bcrypt) | Done |
| Protect all task-related APIs | Done — `protect` middleware on `/api/tasks/*` |
| Task CRUD (Create, List, Update, Delete) | Done — see Section 4 below |

Task model: **Title** (required), **Description**, **Status** (Pending/Completed), **Created At** / **Updated At** (timestamps), linked to **User**.

## 1. User Registration
**Endpoint:** `POST /api/auth/register`

Use this to create a new user account.

### Sample Data Set 1 (John Doe)
**Body (JSON):**
```json
{
  "userName": "john_doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "mobile": "0771234567"
}
```

### Sample Data Set 2 (Jane Smith)
**Body (JSON):**
```json
{
  "userName": "jane_smith",
  "email": "jane@example.com",
  "password": "myPassword987",
  "mobile": "0719876543"
}
```

---

## 2. User Login
**Endpoint:** `POST /api/auth/login`

Use this to generate a JWT token.

### Login Sample (John Doe)
**Body (JSON):**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

### Successful Response
You will receive a JSON response containing the token:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 3. Access Protected Routes
**Endpoint:** `GET /api/auth/user`

Use this to verify your token works.

### How to use the token in Postman:
1. Go to the **Headers** tab.
2. Add a new key: `Authorization`
3. Set the value to: `Bearer <YOUR_TOKEN_HERE>`
   - *Example:* `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Note:** Make sure there is a space between "Bearer" and your token.

Alternatively, in the **Authorization** tab in Postman:
1. Select Type: **Bearer Token**
2. Paste your token in the "Token" field.

---

## 4. Task Management (CRUD) — All require JWT

**Base path:** `/api/tasks`  
**Auth:** Add header `Authorization: Bearer <token>` (or use Postman Bearer Token) for every request below.

### 4.1 Create a task
**Endpoint:** `POST /api/tasks`

**Body (JSON):**
- `title` (required, string)
- `description` (optional, string)
- `status` (optional: `"Pending"` or `"Completed"`, default: `"Pending"`)

**Example:**
```json
{
  "title": "Complete API documentation",
  "description": "Update API_USAGE.md with task endpoints",
  "status": "Pending"
}
```

**Success (201):** Returns the created task with `_id`, `title`, `description`, `status`, `user`, `createdAt`, `updatedAt`.

---

### 4.2 View task list
**Endpoint:** `GET /api/tasks`

Returns all tasks for the logged-in user, sorted by `updatedAt` (newest first).

**Success (200):** Array of task objects.

---

### 4.3 Update a task
**Endpoint:** `PUT /api/tasks/:id`

**Params:** `id` = task `_id` (MongoDB ObjectId).

**Body (JSON):** Any of these (all optional):
- `title` (string)
- `description` (string)
- `status` (`"Pending"` or `"Completed"`)

**Example:**
```json
{
  "title": "Complete API documentation",
  "status": "Completed"
}
```

**Success (200):** Returns the updated task.  
**404:** Task not found or not owned by you.

---

### 4.4 Delete a task
**Endpoint:** `DELETE /api/tasks/:id`

**Params:** `id` = task `_id`.

**Success (200):** `{ "message": "Task deleted" }`  
**404:** Task not found or not owned by you.

---

## Postman testing order (recommended)

1. **Register** — `POST /api/auth/register` (optional if you already have a user).
2. **Login** — `POST /api/auth/login` → copy the `token` from the response.
3. **Set token** — In Postman: Authorization → Type: Bearer Token → paste token (or add header `Authorization: Bearer <token>`).
4. **Create task** — `POST /api/tasks` with body `{ "title": "My first task", "description": "Optional" }`.
5. **List tasks** — `GET /api/tasks` → confirm your task appears.
6. **Update task** — `PUT /api/tasks/<_id>` with body e.g. `{ "status": "Completed" }`.
7. **Delete task** — `DELETE /api/tasks/<_id>`.
8. **No token** — Repeat any task request without the token → expect **401** (authorization denied).
