const express = require("express");
const router = express.Router();
const { register, login, adminLogin } = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/admin/login", adminLogin);
const User = require("../models/User");

// Get all alumni users
router.get("/alumni", async (req, res) => {
  try {
    const alumni = await User.find({ role: "alumni" }).select("-password");
    res.json(alumni);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;
