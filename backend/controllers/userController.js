const User = require('../models/User');

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
