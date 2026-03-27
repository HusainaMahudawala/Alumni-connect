const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
  getAllAlumni,
  getAlumniById,
  searchAlumni,
  connectAlumni,
  offerCollaboration,
  getMyAlumniProfile,
  updateMyAlumniProfile,
  uploadMyProfilePicture
} = require("../controllers/alumniController");

router.get("/", auth, role("alumni"), getAllAlumni);
router.get("/search", auth, role("alumni"), searchAlumni);
router.get("/me", auth, role("alumni"), getMyAlumniProfile);
router.put("/me", auth, role("alumni"), updateMyAlumniProfile);
router.post("/me/profile-picture", auth, role("alumni"), upload.single("profilePicture"), uploadMyProfilePicture);
router.get("/:id", auth, role("alumni"), getAlumniById);

router.post("/:id/connect", auth, role("alumni"), connectAlumni);
router.post("/:id/collaborate", auth, role("alumni"), offerCollaboration);

module.exports = router;
