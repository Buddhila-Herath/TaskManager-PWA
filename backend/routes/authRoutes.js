const express = require("express");
const router = express.Router();
const {
  register,
  login,
  protect,
  currentUser,
  logout,
} = require("../controllers/authController");

// Register new user
router.post("/register", register);

// Login user
router.post("/login", login);
router.get("/user", currentUser);

// Example protected route
router.get("/protected", protect, (req, res) => {
  res.json({
    message: `Welcome user ${req.user.id}, this is a protected route.`,
  });
});

router.post("/logout", logout, protect);
module.exports = router;
