const express = require("express");
const auth = require("../middleware/auth");
const sessionController = require("../controllers/sessionController");

const router = express.Router();

// POST /api/sessions/request - Create a new session request
router.post("/request", auth, sessionController.createSessionRequest);

// GET /api/sessions/my-requests - Get mentor's session requests
router.get("/my-requests", auth, sessionController.getMyRequests);

// GET /api/sessions/stats - Get mentor's dashboard stats
router.get("/stats", auth, sessionController.getMentorStats);

// GET /api/sessions/my-sessions - Get mentor's approved/upcoming sessions
router.get("/my-sessions", auth, sessionController.getMySessions);

// POST /api/sessions/book/:id - Book a session
router.post("/book/:id", auth, sessionController.bookSession);

// GET /api/sessions/my-bookings - Get user's booked sessions
router.get("/my-bookings", auth, sessionController.getMyBookings);

// GET /api/sessions/all - Get all upcoming sessions (for learners)
router.get("/all", auth, sessionController.getAllSessions);

// GET /api/sessions/:id - Get session details
router.get("/:id", auth, sessionController.getSessionById);

module.exports = router;
