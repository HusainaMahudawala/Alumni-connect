const Mentorship = require("../models/Mentorship");

exports.applyMentorship = async (req, res) => {
  try {
    const { purpose } = req.body;
    const alumniId = req.params.alumniId;

    const existing = await Mentorship.findOne({
      student: req.user.id,
      alumni: alumniId
    });

    if (existing) {
      return res.status(400).json({ message: "Already applied" });
    }

    const request = await Mentorship.create({
      student: req.user.id,
      alumni: alumniId,
      purpose // ✅ added
    });

    res.status(201).json(request);
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
