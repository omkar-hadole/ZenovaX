const express = require("express");
const multer = require("multer");
const { protect } = require("../middleware/auth");
const profileController = require("../controllers/profileController");

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});

router.post(
    "/complete",
    protect,
    upload.single("profileImage"),
    profileController.completeProfile
);

router.get("/me", protect, profileController.getMe);

router.put(
    "/update",
    protect,
    upload.single("profileImage"),
    profileController.updateProfile
);

router.get("/mentors", protect, profileController.getMentors);

router.get("/:id", protect, profileController.getProfileById);

module.exports = router;
