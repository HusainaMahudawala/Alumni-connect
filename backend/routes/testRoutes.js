const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { runMentorshipSlotsMonthlyMaintenance } = require("../scripts/mentorshipSlotsScheduler");

router.get("/protected", authMiddleware, (req, res) => {
  res.json({
    message: "Protected route accessed successfully",
    user: req.user
  });
});

router.post("/run-slot-maintenance", authMiddleware, async (req, res) => {
  try {
    const forceRun = req.body?.forceRun !== false;
    const dateValue = req.body?.date;

    let runDate = new Date();
    if (dateValue) {
      const parsed = new Date(dateValue);
      if (!Number.isNaN(parsed.getTime())) {
        runDate = parsed;
      }
    }

    const result = await runMentorshipSlotsMonthlyMaintenance({
      forceRun,
      now: runDate
    });

    return res.json({
      success: true,
      result
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});


module.exports = router;
