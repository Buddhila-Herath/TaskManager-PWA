const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1]; // "Bearer token"

  if (!token) {
    return res
      .status(401)
      .json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id || decoded.userId,
      role: decoded.role || "user",
    };
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !req.user.role) {
    return res.status(403).json({ message: "Access denied" });
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }

  next();
};

protect.authorizeRoles = authorizeRoles;

module.exports = protect;
