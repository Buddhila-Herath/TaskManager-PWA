const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const { getAllUsers, getAllTasks } = require("../controllers/adminController");

// All routes in this file are admin-only
router.use(protect, protect.authorizeRoles("admin"));

// GET /api/admin/users - list all users
router.get("/users", getAllUsers);

// GET /api/admin/tasks - list all tasks
router.get("/tasks", getAllTasks);

module.exports = router;

