const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const { getFirebaseAuth } = require("../config/firebaseAdmin");

const router = express.Router();

const VALID_REGISTRATION_ROLES = ["client", "restaurant"];

function buildToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

function buildAuthResponse(user) {
  return {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    token: buildToken(user),
  };
}

// Register
router.post("/register", async (req, res) => {
  const { fullName, email, password, role = "client" } = req.body;

  try {
    if (!fullName || !email || !password) {
      return res
        .status(400)
        .json({ message: "fullName, email and password are required" });
    }

    if (!VALID_REGISTRATION_ROLES.includes(role)) {
      return res.status(400).json({ message: "Invalid role for registration" });
    }

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role,
      authProvider: "local",
    });

    res.status(201).json(buildAuthResponse(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    if (!user.password) {
      return res
        .status(400)
        .json({
          message:
            "This account uses Google sign-in. Continue with Google instead.",
        });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    res.json(buildAuthResponse(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/google", async (req, res) => {
  const { idToken, role = "client", mode = "login", fullName = "" } = req.body;

  try {
    if (!idToken) {
      return res.status(400).json({ message: "Google ID token is required" });
    }

    if (mode === "register" && !VALID_REGISTRATION_ROLES.includes(role)) {
      return res.status(400).json({ message: "Invalid role for registration" });
    }

    const decodedToken = await getFirebaseAuth().verifyIdToken(idToken);
    if (!decodedToken.email || !decodedToken.email_verified) {
      return res
        .status(400)
        .json({ message: "Google account email must be verified" });
    }

    let user = await User.findOne({
      $or: [
        { firebaseUid: decodedToken.uid },
        { email: decodedToken.email.toLowerCase() },
      ],
    });

    if (!user && mode === "login") {
      return res
        .status(404)
        .json({
          message: "No account found for this Google user. Register first.",
        });
    }

    if (!user) {
      user = await User.create({
        fullName:
          fullName || decodedToken.name || decodedToken.email.split("@")[0],
        email: decodedToken.email.toLowerCase(),
        role,
        avatar: decodedToken.picture || "",
        authProvider: "google",
        firebaseUid: decodedToken.uid,
      });
    } else {
      const updates = {};

      if (!user.firebaseUid) {
        updates.firebaseUid = decodedToken.uid;
      } else if (user.firebaseUid !== decodedToken.uid) {
        return res
          .status(409)
          .json({
            message: "This email is already linked to another Google account",
          });
      }

      if (!user.fullName && (fullName || decodedToken.name)) {
        updates.fullName = fullName || decodedToken.name;
      }

      if (!user.avatar && decodedToken.picture) {
        updates.avatar = decodedToken.picture;
      }

      if (user.authProvider !== "google") {
        updates.authProvider = "google";
      }

      if (Object.keys(updates).length > 0) {
        Object.assign(user, updates);
        await user.save();
      }
    }

    res.json(buildAuthResponse(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Profile
router.put("/update-profile", protect, async (req, res) => {
  const { fullName } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updates = {};

    if (fullName) {
      updates.fullName = fullName;
    }

    if (Object.keys(updates).length > 0) {
      Object.assign(user, updates);
      await user.save();
    }

    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
