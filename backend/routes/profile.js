const express = require("express");
const multer = require("multer");
const auth = require("../middleware/auth");
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
    auth,
    upload.single("profileImage"),
    profileController.completeProfile
);

router.get("/me", auth, profileController.getMe);

router.put(
    "/update",
    auth,
    upload.single("profileImage"),
    profileController.updateProfile
);

router.get("/mentors", auth, profileController.getMentors);

router.get("/:id", auth, profileController.getProfileById);

module.exports = router;
