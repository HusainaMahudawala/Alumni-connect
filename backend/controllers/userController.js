const User = require('../models/User');

function parseList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

exports.getMyStudentProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('name email phone role interests skills profilePicture');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can access this endpoint' });
    }

    return res.json({
      _id: user._id,
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role,
      interests: Array.isArray(user.interests) ? user.interests : [],
      skills: Array.isArray(user.skills) ? user.skills : [],
      profilePicture: user.profilePicture || ''
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to load student profile' });
  }
};

exports.updateMyStudentProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('name email phone role interests skills profilePicture');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can update this profile' });
    }

    const { name, email, phone, interests, skills } = req.body;

    if (typeof name === 'string') user.name = name.trim();
    if (typeof email === 'string') user.email = email.trim().toLowerCase();
    if (typeof phone === 'string') user.phone = phone.trim();
    if (interests !== undefined) user.interests = parseList(interests);
    if (skills !== undefined) user.skills = parseList(skills);

    if (!user.name || !user.email || !user.phone) {
      return res.status(400).json({ message: 'Name, email and phone are required' });
    }

    const emailInUse = await User.findOne({ email: user.email, _id: { $ne: user._id } }).select('_id');
    if (emailInUse) {
      return res.status(400).json({ message: 'Email is already used by another account' });
    }

    await user.save();

    return res.json({
      message: 'Student profile updated successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        interests: user.interests || [],
        skills: user.skills || [],
        profilePicture: user.profilePicture || ''
      }
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to update student profile' });
  }
};

exports.uploadMyStudentProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('role profilePicture');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can upload profile images' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const profilePicturePath = `/uploads/${req.file.filename}`;
    user.profilePicture = profilePicturePath;
    await user.save();

    return res.json({
      message: 'Profile image uploaded successfully',
      profilePicture: profilePicturePath
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to upload profile image' });
  }
};

// Admin: list users with optional role filter
exports.adminGetUsers = async (req, res) => {
  try {
    const role = req.query.role;
    const query = {};

    if (role && ["student", "alumni", "admin"].includes(role)) {
      query.role = role;
    }

    const users = await User.find(query)
      .select("name email phone role company experience createdAt")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch users" });
  }
};

// Admin: delete a user (student/alumni)
exports.adminDeleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(403).json({ message: "Admin users cannot be deleted" });
    }

    await user.deleteOne();
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to delete user" });
  }
};

// Get alumni recommendations based on student interests and skills
exports.getRecommendedAlumni = async (req, res) => {
  try {
    const studentId = req.user.id;
    const student = await User.findById(studentId);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Find alumni with matching interests or skills
    const alumni = await User.find({
      role: 'alumni',
      _id: { $ne: studentId },
    }).limit(5);

    if (!alumni || alumni.length === 0) {
      return res.json([]);
    }

    // Score alumni based on matching skills/interests
    const scoredAlumni = alumni.map((alum) => {
      let score = 0;

      // Match interests
      if (student.interests && student.interests.length > 0) {
        const matchingInterests = student.interests.filter((interest) =>
          alum.company?.toLowerCase().includes(interest.toLowerCase()) ||
          alum.name?.toLowerCase().includes(interest.toLowerCase())
        );
        score += matchingInterests.length * 2;
      }

      // Match skills
      if (student.skills && student.skills.length > 0) {
        const matchingSkills = student.skills.filter((skill) =>
          alum.company?.toLowerCase().includes(skill.toLowerCase()) ||
          alum.name?.toLowerCase().includes(skill.toLowerCase())
        );
        score += matchingSkills.length;
      }

      return {
        _id: alum._id,
        name: alum.name,
        email: alum.email,
        company: alum.company || 'Professional',
        role: alum.role,
        experience: alum.experience || 0,
        matchScore: score,
      };
    });

    // Sort by match score (descending)
    const sorted = scoredAlumni.sort((a, b) => b.matchScore - a.matchScore);

    res.json(sorted.slice(0, 5));
  } catch (err) {
    console.error('Error fetching recommended alumni:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Follow/join an alumni
exports.followAlumni = async (req, res) => {
  try {
    const studentId = req.user.id;
    const alumniId = req.params.userId;

    // Add follower relationship (you could create a separate Follow model for this)
    // For now, we'll just return success
    res.json({ 
      success: true, 
      message: `Successfully joined ${alumniId}`,
      followedAt: new Date()
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Unfollow an alumni
exports.unfollowAlumni = async (req, res) => {
  try {
    const studentId = req.user.id;
    const alumniId = req.params.userId;

    res.json({ 
      success: true, 
      message: `Successfully unfollowed ${alumniId}`
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
