const Task = require("../models/Task");

const emitToUser = (req, eventName, payload) => {
  const io = req.app.get("io");
  const userId = req.user?.id;

  if (!io || !userId) {
    return;
  }

  io.to(`user:${userId}`).emit(eventName, payload);
};

exports.createTask = async (req, res) => {
  const { title, description, status } = req.body;
  const userId = req.user.id;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: "Title is required" });
  }

  try {
    const task = new Task({
      title: title.trim(),
      description: description ? description.trim() : "",
      status: status === "Completed" ? "Completed" : "Pending",
      user: userId,
    });
    await task.save();

    emitToUser(req, "task_created", task);

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getTasks = async (req, res) => {
  const userId = req.user.id;
  try {
    const tasks = await Task.find({ user: userId }).sort({ updatedAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, description, status } = req.body;
  const userId = req.user.id;

  try {
    const task = await Task.findOne({ _id: id, user: userId });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (status !== undefined && ["Pending", "Completed"].includes(status)) {
      task.status = status;
    }
    await task.save();

    emitToUser(req, "task_updated", task);

    res.json(task);
  } catch (err) {
    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteTask = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const task = await Task.findOneAndDelete({ _id: id, user: userId });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    emitToUser(req, "task_deleted", { id: task._id.toString() });

    res.json({ message: "Task deleted" });
  } catch (err) {
    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(500).json({ message: "Server error" });
  }
};
