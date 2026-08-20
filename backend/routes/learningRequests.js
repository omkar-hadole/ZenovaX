const express = require("express");
const { protect, requireProfileComplete, authorize } = require("../middleware/auth");
const { learningRequestCreateLimiter, learningRequestInterestLimiter } = require("../middleware/rateLimiter");
const learningRequestController = require("../controllers/learningRequestController");

const router = express.Router();

router.use(protect, requireProfileComplete);

router.get("/", learningRequestController.listLearningRequests);
router.get("/mentor-demand", authorize('MENTOR', 'BOTH', 'ADMIN'), learningRequestController.getLearnerDemand);

router.post("/", learningRequestCreateLimiter, learningRequestController.createLearningRequest);

router.get("/:id", learningRequestController.getLearningRequestById);

router.post("/:id/interested", learningRequestInterestLimiter, learningRequestController.addInterest);
router.delete("/:id/interested", learningRequestInterestLimiter, learningRequestController.removeInterest);

router.post("/:id/close", learningRequestController.closeRequest);

module.exports = router;