const Task = require("../models/Task");
const { sendPushToUser } = require("../utils/pushService");

const VALID_STATUSES = ["Pending", "In Progress", "Completed"];
const VALID_PRIORITIES = ["Low", "Medium", "High", "Urgent"];

const emitToUser = (req, eventName, payload) => {
  const io = req.app.get("io");
  const userId = req.user?.id;

  if (!io || !userId) {
    return;
  }

  io.to(`user:${userId}`).emit(eventName, payload);
};

const normaliseStatus = (status) =>
  VALID_STATUSES.includes(status) ? status : "Pending";

const isValidPriority = (priority) => VALID_PRIORITIES.includes(priority);

const toOptionalDate = (value) => (value ? new Date(value) : undefined);

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
      status: normaliseStatus(status),
      priority: priority && isValidPriority(priority) ? priority : "Medium",
      dueDate: toOptionalDate(dueDate),
      user: userId,
    });
    await task.save();

    emitToUser(req, "task_created", task);

    // Fire-and-forget push notification
    // eslint-disable-next-line no-console
    console.log("[push] createTask: sending push for task", {
      userId,
      taskId: task._id.toString(),
      title: task.title,
      status: task.status,
      dueDate: task.dueDate,
    });
    sendPushToUser(userId, {
      title: "New task created",
      body: task.title,
      data: {
        action: "task_created",
        taskId: task._id.toString(),
        status: task.status,
        dueDate: task.dueDate,
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

    if (title !== undefined) {
      task.title = title.trim();
    }
    if (description !== undefined) {
      task.description = description.trim();
    }
    if (status !== undefined && VALID_STATUSES.includes(status)) {
      task.status = status;
    }
    if (priority !== undefined && isValidPriority(priority)) {
      task.priority = priority;
    }
    if (dueDate !== undefined) {
      task.dueDate = toOptionalDate(dueDate);
    }
    await task.save();

    emitToUser(req, "task_updated", task);

    // Fire-and-forget push notification for generic task updates.
    // We send a dedicated notification when a task is marked as completed below,
    // so this generic "updated" notification is only used for non-completed states.
    if (task.status !== "Completed") {
      // eslint-disable-next-line no-console
      console.log("[push] updateTask: sending generic update push", {
        userId,
        taskId: task._id.toString(),
        title: task.title,
        previousStatus,
        newStatus: task.status,
        dueDate: task.dueDate,
      });
      sendPushToUser(userId, {
        title: "Task updated",
        body: task.title,
        data: {
          action: "task_updated",
          taskId: task._id.toString(),
          status: task.status,
          dueDate: task.dueDate,
        },
      }).catch(() => {});
    }

    if (previousStatus !== "Completed" && task.status === "Completed") {
      // Fire-and-forget push notification when task is marked as completed
      // eslint-disable-next-line no-console
      console.log("[push] updateTask: sending completed push", {
        userId,
        taskId: task._id.toString(),
        title: task.title,
        previousStatus,
        newStatus: task.status,
        dueDate: task.dueDate,
      });
      sendPushToUser(userId, {
        title: "Task completed",
        body: task.title,
        data: {
          action: "task_completed",
          taskId: task._id.toString(),
          status: task.status,
          dueDate: task.dueDate,
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

    // Fire-and-forget push notification when a task is deleted.
    // eslint-disable-next-line no-console
    console.log("[push] deleteTask: sending deleted push", {
      userId,
      taskId: task._id.toString(),
      title: task.title,
      status: task.status,
      dueDate: task.dueDate,
    });
    sendPushToUser(userId, {
      title: "Task deleted",
      body: task.title,
      data: {
        action: "task_deleted",
        taskId: task._id.toString(),
        status: task.status,
        dueDate: task.dueDate,
      },
    }).catch(() => {});

    res.json({ message: "Task deleted" });
  } catch (err) {
    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(500).json({ message: "Server error" });
  }
};
