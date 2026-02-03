const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

router.post(
  "/post-job",
  auth,
  role(["alumni"]),   // role check here
  (req, res) => {
    res.json({ message: "Job posted successfully" });
  }
);

module.exports = router;
