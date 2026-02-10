const Mentorship = require("../models/Mentorship");

exports.applyMentorship = async (req, res) => {
  try {
    const { purpose } = req.body;
    const alumniId = req.params.alumniId;

    const existing = await Mentorship.findOne({
      student: req.user.id,
      alumni: alumniId
    });

    // 🚫 Already applied (any status)
    if (existing) {
      return res.status(400).json({
        message: `You have already applied. Current status: ${existing.status}`
      });
    }

    const request = await Mentorship.create({
      student: req.user.id,
      alumni: alumniId,
      purpose
    });

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

 exports.myMentorships = async (req, res) => {
  try {
    const requests = await Mentorship.find({
      student: req.user.id
    })
      .populate("alumni", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.viewRequests = async (req, res) => {
  try {
    const requests = await Mentorship.find({ alumni: req.user.id })
      .populate("student", "name email");

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const request = await Mentorship.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.approvedMentorships = async (req, res) => {
  try {
    const approved = await Mentorship.find({
      alumni: req.user.id,
      status: "approved"
    })
      .populate("student", "name email");

    res.status(200).json(approved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
