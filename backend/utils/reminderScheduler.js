const Task = require("../models/Task");
const { sendPushToUser, isConfigured } = require("./pushService");

const DEFAULT_LEAD_MINUTES = 60;
const DEFAULT_POLL_MS = 60_000;

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const startTaskReminderScheduler = () => {
  if (!isConfigured()) {
    console.warn(
      "[reminder] VAPID keys are not configured; task reminder scheduler will not run.",
    );
    return;
  }

  const leadMinutes = parsePositiveInt(
    process.env.TASK_REMINDER_LEAD_MINUTES,
    DEFAULT_LEAD_MINUTES,
  );
  const pollMs = parsePositiveInt(
    process.env.TASK_REMINDER_POLL_MS,
    DEFAULT_POLL_MS,
  );

  const tick = async () => {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + leadMinutes * 60_000);

    try {
      const candidates = await Task.find({
        dueDate: { $ne: null, $lte: windowEnd },
        reminderSent: { $ne: true },
        status: { $ne: "Completed" },
      })
        .sort({ dueDate: 1 })
        .limit(100);

      if (!candidates.length) {
        return;
      }

      // eslint-disable-next-line no-console
      console.log("[reminder] Sending due-date reminders for tasks:", {
        count: candidates.length,
        leadMinutes,
      });

      await Promise.all(
        candidates.map(async (task) => {
          const userId = task.user;
          const dueDateIso = task.dueDate?.toISOString();

          try {
            await sendPushToUser(userId, {
              title: "Task due soon",
              body: task.title,
              data: {
                action: "task_due_soon",
                taskId: task._id.toString(),
                status: task.status,
                dueDate: dueDateIso,
              },
            });

            task.reminderSent = true;
            await task.save();
          } catch (error) {
            console.warn(
              "[reminder] Failed to send reminder for task",
              task._id.toString(),
              error.message,
            );
          }
        }),
      );
    } catch (error) {
      console.warn("[reminder] Error while running reminder tick:", error.message);
    }
  };

  // eslint-disable-next-line no-console
  console.log(
    "[reminder] Starting task reminder scheduler with leadMinutes=%d pollMs=%d",
    leadMinutes,
    pollMs,
  );

  // Run on interval; fire-and-forget.
  setInterval(() => {
    void tick();
  }, pollMs);

  // Also run once shortly after startup.
  void tick();
};

module.exports = {
  startTaskReminderScheduler,
  // Exported for unit testing
  parsePositiveInt,
};

