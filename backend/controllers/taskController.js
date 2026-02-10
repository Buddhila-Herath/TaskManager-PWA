const Task = require("../models/Task");
const { sendPushToUser } = require("../utils/pushService");

const emitToUser = (req, eventName, payload) => {
  const io = req.app.get("io");
  const userId = req.user?.id;

  if (!io || !userId) {
    return;
  }

  io.to(`user:${userId}`).emit(eventName, payload);
};

exports.createTask = async (req, res) => {
  const { title, description, status, priority, dueDate } = req.body;
  const userId = req.user.id;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: "Title is required" });
  }

  try {
    const task = new Task({
      title: title.trim(),
      description: description ? description.trim() : "",
      status: status === "Completed" ? "Completed" : "Pending",
      priority:
        priority && ["Low", "Medium", "High", "Urgent"].includes(priority)
          ? priority
          : "Medium",
      dueDate: dueDate ? new Date(dueDate) : undefined,
      user: userId,
    });
    await task.save();

    emitToUser(req, "task_created", task);

    // Fire-and-forget push notification
    sendPushToUser(userId, {
      title: "New task created",
      body: task.title,
      data: {
        action: "task_created",
        taskId: task._id.toString(),
      },
    }).catch(() => {});

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getTasks = async (req, res) => {
  const userId = req.user.id;
  const isAdmin = req.user.role === "admin";

  try {
    const query = isAdmin ? {} : { user: userId };
    const tasks = await Task.find(query).sort({ updatedAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, description, status, priority, dueDate } = req.body;
  const userId = req.user.id;
  const isAdmin = req.user.role === "admin";

  try {
    const filter = isAdmin ? { _id: id } : { _id: id, user: userId };
    const task = await Task.findOne(filter);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const previousStatus = task.status;

    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (status !== undefined && ["Pending", "Completed"].includes(status)) {
      task.status = status;
    }
    if (priority !== undefined) {
      if (["Low", "Medium", "High", "Urgent"].includes(priority)) {
        task.priority = priority;
      }
    }
    if (dueDate !== undefined) {
      task.dueDate = dueDate ? new Date(dueDate) : undefined;
    }
    await task.save();

    emitToUser(req, "task_updated", task);

    if (previousStatus !== "Completed" && task.status === "Completed") {
      // Fire-and-forget push notification when task is marked as completed
      sendPushToUser(userId, {
        title: "Task completed",
        body: task.title,
        data: {
          action: "task_completed",
          taskId: task._id.toString(),
        },
      }).catch(() => {});
    }

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
  const isAdmin = req.user.role === "admin";

  try {
    const filter = isAdmin ? { _id: id } : { _id: id, user: userId };
    const task = await Task.findOneAndDelete(filter);
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
