const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// REGISTER
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, role, skills, interests, company, experience, mentorshipSlots } = req.body;

    // Validation
    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({ message: "All basic fields are required" });
    }

    if (role === "student" && (!skills || !interests)) {
      return res.status(400).json({ message: "Skills and interests are required for students" });
    }

    if (role === "alumni" && !company) {
      return res.status(400).json({ message: "Company name is required for alumni" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      name,
      email,
      phone,
      password: hashedPassword,
      role
    };

    // Add role-specific fields
    if (role === "student") {
      userData.skills = Array.isArray(skills) ? skills : [skills];
      userData.interests = Array.isArray(interests) ? interests : [interests];
    } else if (role === "alumni") {
      userData.company = company;
      userData.experience = parseInt(experience) || 0;
      userData.mentorshipSlots = parseInt(mentorshipSlots) || 0;
    }

    const user = new User(userData);
    await user.save();

    // Create token for auto-login
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ...(role === "student" && { skills: user.skills, interests: user.interests }),
        ...(role === "alumni" && { company: user.company, experience: user.experience, mentorshipSlots: user.mentorshipSlots })
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: error.message || "Registration failed" });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
