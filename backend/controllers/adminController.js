const User = require("../models/User");
const Task = require("../models/Task");

// GET /api/admin/users
// List all users (admin-only)
exports.getAllUsers = async (_req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/admin/tasks
// List all tasks (admin-only)
exports.getAllTasks = async (_req, res) => {
  try {
    const tasks = await Task.find()
      .populate("user", "email userName role mobile")
      .sort({ updatedAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

