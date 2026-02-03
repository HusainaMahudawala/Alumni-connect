const express = require("express");
const router = express.Router();

const { applyOpportunity,viewApplicants} = require("../controllers/opportunityController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const Opportunity = require("../models/Opportunity");

// Alumni posts opportunity
router.post(
  "/post",
  auth,
  role(["alumni"]),
  async (req, res) => {
    try {
      const { title, description, type, company, deadline } = req.body;

      const post = new Opportunity({
        postedBy: req.user.id,
        title,
        description,
        type,
        company,
        deadline
      });

      await post.save();
      res.status(201).json({ message: "Opportunity posted successfully" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);
// View all opportunities
router.get(
  "/all",
  auth,
  async (req, res) => {
    try {
      const data = await Opportunity.find().populate("postedBy", "name company");
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);


// APPLY ROUTE (STUDENT)
router.post(
  "/apply/:id",
  auth,
  role("student"),
  applyOpportunity
);
router.get(
  "/applicants/:id",
  auth,
  role("alumni"),
  viewApplicants
);


module.exports = router;
