const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const sessionController = require("../controllers/sessionController");

const router = express.Router();

router.post("/request", protect, authorize('MENTOR', 'BOTH'), sessionController.createSessionRequest);

router.get("/request/:id", protect, authorize('MENTOR', 'BOTH', 'ADMIN'), sessionController.getSessionRequestById);

router.put("/request/:id", protect, authorize('MENTOR', 'BOTH', 'ADMIN'), sessionController.updateSessionRequest);

router.get("/my-requests", protect, authorize('MENTOR', 'BOTH'), sessionController.getMyRequests);

router.get("/stats", protect, authorize('MENTOR', 'BOTH'), sessionController.getMentorStats);

router.get("/activity", protect, authorize('MENTOR', 'BOTH'), sessionController.getRecentActivity);

router.get("/my-sessions", protect, authorize('MENTOR', 'BOTH'), sessionController.getMySessions);

router.post("/book/:id", protect, sessionController.bookSession);

router.get("/my-bookings", protect, sessionController.getMyBookings);

router.get("/all", protect, sessionController.getAllSessions);

router.post("/verify-attendance", protect, authorize('MENTOR', 'BOTH'), sessionController.verifyAttendance);

router.get("/:id", protect, sessionController.getSessionById);

module.exports = router;
