const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const buildJwtPayload = (user) => ({
  id: user._id,
  role: user.role || "user",
});

const buildUserResponse = (user) => ({
  id: user._id,
  email: user.email,
  role: user.role,
  userName: user.userName,
  mobile: user.mobile,
  avatarUrl: user.avatarUrl || "",
});

exports.register = async (req, res) => {
  const { email, password, mobile, userName, role } = req.body;

  try {
    const userExists = await User.findOne({ email });
    const userNameExists = await User.findOne({ userName });
    const mobileExists = await User.findOne({ mobile });

    if (userExists) {
      return res.status(400).json({ message: "Email already exists" });
    }
    if (userNameExists) {
      return res.status(400).json({ message: "User Name already exists" });
    }
    if (mobileExists) {
      return res.status(400).json({ message: "Mobile already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const normalizedRole = role === "admin" ? "admin" : "user";

    const user = new User({
      email,
      password: hashedPassword,
      mobile,
      userName,
      role: normalizedRole,
    });

    await user.save();

    const token = jwt.sign(buildJwtPayload(user), process.env.JWT_SECRET);

    res.status(201).json({
      token,
      user: buildUserResponse(user),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(buildJwtPayload(user), process.env.JWT_SECRET);

    res.json({
      token,
      user: buildUserResponse(user),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.protect = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token)
    return res.status(401).json({ message: "No token, authorization denied" });

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

// verify current user
exports.currentUser = async (req, res) => {
  const authHeader = req.header("Authorization");
  if (!authHeader) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded.userId;

    if (!userId) {
      return res.status(401).json({ message: "Token is not valid" });
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(buildUserResponse(user));
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

exports.logout = async (req, res) => {
  try {
    res.json({ message: "Logout success" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(buildUserResponse(user));
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateProfile = async (req, res) => {
  const { email, userName, mobile, avatarUrl } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: "Email already exists" });
      }
      user.email = email;
    }

    if (userName && userName !== user.userName) {
      const userNameExists = await User.findOne({ userName });
      if (userNameExists) {
        return res.status(400).json({ message: "User Name already exists" });
      }
      user.userName = userName;
    }

    if (mobile && mobile !== user.mobile) {
      const mobileExists = await User.findOne({ mobile });
      if (mobileExists) {
        return res.status(400).json({ message: "Mobile already exists" });
      }
      user.mobile = mobile;
    }

    if (typeof avatarUrl === "string") {
      user.avatarUrl = avatarUrl;
    }

    await user.save();

    res.json(buildUserResponse(user));
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
