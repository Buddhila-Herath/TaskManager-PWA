const express = require("express");
const protect = require("../middleware/authMiddleware");
const PushSubscription = require("../models/PushSubscription");

const router = express.Router();

router.use(protect);

// Save or update a push subscription for the current user
router.post("/subscribe", async (req, res) => {
  const { subscription } = req.body;
  const userId = req.user.id;

  if (!subscription || !subscription.endpoint || !subscription.keys) {
    return res.status(400).json({ message: "Invalid subscription payload" });
  }

  try {
    const { endpoint, keys, expirationTime } = subscription;

    const doc = await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        user: userId,
        endpoint,
        keys,
        expirationTime: expirationTime ? new Date(expirationTime) : null,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ message: "Subscription saved", subscription: doc });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Remove a subscription for the current user
router.delete("/unsubscribe", async (req, res) => {
  const { endpoint } = req.body;
  const userId = req.user.id;

  if (!endpoint) {
    return res.status(400).json({ message: "Endpoint is required" });
  }

  try {
    await PushSubscription.deleteOne({ endpoint, user: userId });
    res.json({ message: "Subscription removed" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

