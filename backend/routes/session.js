const express = require("express");
const { protect } = require("../middleware/auth");
const sessionController = require("../controllers/sessionController");

const router = express.Router();

router.post("/request", protect, sessionController.createSessionRequest);

router.get("/request/:id", protect, sessionController.getSessionRequestById);

router.put("/request/:id", protect, sessionController.updateSessionRequest);

router.get("/my-requests", protect, sessionController.getMyRequests);

router.get("/stats", protect, sessionController.getMentorStats);

router.get("/activity", protect, sessionController.getRecentActivity);

router.get("/my-sessions", protect, sessionController.getMySessions);

router.post("/book/:id", protect, sessionController.bookSession);

router.get("/my-bookings", protect, sessionController.getMyBookings);

router.get("/all", protect, sessionController.getAllSessions);

router.post("/verify-attendance", protect, sessionController.verifyAttendance);

router.get("/:id", protect, sessionController.getSessionById);

module.exports = router;
