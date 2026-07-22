const express = require("express");
const multer = require("multer");
const { protect } = require("../middleware/auth");
const profileController = require("../controllers/profileController");
const { BadRequestError } = require("../utils/errors");

const router = express.Router();

const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
            return cb(new BadRequestError("Only JPEG, PNG, WEBP, or GIF images are allowed"));
        }
        cb(null, true);
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

router.delete("/me", protect, profileController.deactivateAccount);

router.get("/mentors", protect, profileController.getMentors);

router.get("/:id", protect, profileController.getProfileById);

module.exports = router;
