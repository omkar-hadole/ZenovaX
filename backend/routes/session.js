const express = require("express");
const auth = require("../middleware/auth");
const sessionController = require("../controllers/sessionController");

const router = express.Router();

router.post("/request", auth, sessionController.createSessionRequest);

router.get("/request/:id", auth, sessionController.getSessionRequestById);

router.put("/request/:id", auth, sessionController.updateSessionRequest);

router.get("/my-requests", auth, sessionController.getMyRequests);

router.get("/stats", auth, sessionController.getMentorStats);

router.get("/my-sessions", auth, sessionController.getMySessions);

router.post("/book/:id", auth, sessionController.bookSession);

router.get("/my-bookings", auth, sessionController.getMyBookings);

router.get("/all", auth, sessionController.getAllSessions);

router.post("/verify-attendance", auth, sessionController.verifyAttendance);

router.get("/:id", auth, sessionController.getSessionById);

module.exports = router;
