const express = require("express");
const multer = require("multer");
const auth = require("../middleware/auth");
const profileController = require("../controllers/profileController");

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
});

router.post(
    "/complete",
    auth,
    upload.single("profileImage"),
    profileController.completeProfile
);

// GET /api/profile/me - Fetch current user profile
router.get("/me", auth, profileController.getMe);

// PUT /api/profile/update - Update user profile
router.put(
    "/update",
    auth,
    upload.single("profileImage"),
    profileController.updateProfile
);

// GET /api/profile/mentors - Fetch all mentors
router.get("/mentors", auth, profileController.getMentors);

// GET /api/profile/:id - Fetch specific user profile by ID
router.get("/:id", auth, profileController.getProfileById);

module.exports = router;
