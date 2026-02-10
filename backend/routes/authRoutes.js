const express = require("express");
const router = express.Router();
const {
  register,
  login,
  protect,
  currentUser,
  logout,
  getProfile,
  updateProfile,
} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

// Register new user
router.post("/register", register);

// Login user
router.post("/login", login);
router.get("/user", currentUser);

// Profile routes
router.get("/me", authMiddleware, getProfile);
router.put("/me", authMiddleware, updateProfile);

// Example protected route
router.get("/protected", protect, (req, res) => {
  res.json({
    message: `Welcome user ${req.user.id}, this is a protected route.`,
  });
});

router.post("/logout", authMiddleware, logout);
module.exports = router;
