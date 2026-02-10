const webPush = require("web-push");
const PushSubscription = require("../models/PushSubscription");

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || "mailto:admin@example.com";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} else {
  console.warn(
    "[pushService] VAPID keys are not configured. Push notifications will be disabled."
  );
}

const isConfigured = () => Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);

const sendPushToUser = async (userId, payload) => {
  if (!isConfigured()) {
    return;
  }

  const subscriptions = await PushSubscription.find({ user: userId });

  if (!subscriptions.length) {
    return;
  }

  const payloadString =
    typeof payload === "string" ? payload : JSON.stringify(payload);

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const subscription = {
        endpoint: sub.endpoint,
        keys: sub.keys,
        expirationTime: sub.expirationTime || null,
      };

      try {
        await webPush.sendNotification(subscription, payloadString);
      } catch (err) {
        const statusCode = err.statusCode || err.code;

        if (statusCode === 404 || statusCode === 410) {
          // Subscription is no longer valid; clean it up.
          await PushSubscription.deleteOne({ _id: sub._id });
        } else {
          console.warn(
            "[pushService] Failed to send notification:",
            err.message
          );
        }
      }
    })
  );
};

module.exports = {
  sendPushToUser,
  isConfigured,
};

