const express = require("express");
const { protect, authorize, requireProfileComplete } = require("../middleware/auth");
const sessionController = require("../controllers/sessionController");

const router = express.Router();

router.use(protect, requireProfileComplete);

router.post("/request", authorize('MENTOR', 'BOTH'), sessionController.createSessionRequest);

router.get("/request/:id", authorize('MENTOR', 'BOTH', 'ADMIN'), sessionController.getSessionRequestById);

router.put("/request/:id", authorize('MENTOR', 'BOTH', 'ADMIN'), sessionController.updateSessionRequest);

router.get("/my-requests", authorize('MENTOR', 'BOTH'), sessionController.getMyRequests);

router.get("/stats", authorize('MENTOR', 'BOTH'), sessionController.getMentorStats);



router.get("/my-sessions", authorize('MENTOR', 'BOTH'), sessionController.getMySessions);

router.post("/book/:id", sessionController.bookSession);
router.post("/verify-payment", sessionController.verifyPayment);
router.get("/booking-status/:id", sessionController.getBookingStatus);
router.get("/my-bookings", sessionController.getMyBookings);

router.get("/all", sessionController.getAllSessions);

router.post("/verify-attendance", authorize('MENTOR', 'BOTH'), sessionController.verifyAttendance);

router.get("/:id/live-access", sessionController.getLiveAccess);

router.get("/:id", sessionController.getSessionById);

module.exports = router;
