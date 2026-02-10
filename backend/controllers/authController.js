const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const { email, password, mobile, userName } = req.body;
  console.log(userName)
  try {
    const userExists = await User.findOne({ email });
    const userNameExists = await User.findOne({ userName });
    const mobileExists = await User.findOne({ mobile });

    if (userExists) {
      console.log("User already exists");
      return res.status(400).json({ message: "Email already exists" });
    }
    if (userNameExists) {
      console.log("User Name already exists");
      return res.status(400).json({ message: "User Name already exists" });
    }
    if (mobileExists) {
      console.log("Mobile already exists");
      return res.status(400).json({ message: "Mobile already exists" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = new User({
      email,
      password: hashedPassword,
      mobile,
      userName
    });

    await user.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (err) {
    console.log(err);
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

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({
      token,
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
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

//verify current user
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

    res.json(user); // send user details as response
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
