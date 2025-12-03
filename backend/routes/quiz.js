const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

// Create a new quiz (Draft)
router.post("/create", auth, async (req, res, next) => {
    try {
        const { sessionId, title, description, duration, totalMarks, passingMarks, questions } = req.body;

        // Verify session belongs to mentor
        const session = await req.prisma.session.findUnique({
            where: { id: sessionId }
        });

        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }

        if (session.mentorId !== req.user.id) {
            return res.status(403).json({ error: "Not authorized to create quiz for this session" });
        }

        // Create Quiz and Questions in transaction
        const quiz = await req.prisma.quiz.create({
            data: {
                title,
                description,
                duration: parseInt(duration) || null,
                totalMarks: parseInt(totalMarks) || 0,
                passingMarks: parseInt(passingMarks) || 0,
                status: 'DRAFT',
                session: { connect: { id: sessionId } },
                creator: { connect: { id: req.user.id } },
                questions: {
                    create: questions.map((q, index) => ({
                        questionText: q.questionText,
                        options: JSON.stringify(q.options), // Store as JSON string
                        correctAnswer: q.correctAnswer,
                        marks: parseInt(q.marks) || 1,
                        order: index + 1
                    }))
                }
            },
            include: {
                questions: true
            }
        });

        res.status(201).json({ success: true, quiz });
    } catch (error) {
        next(error);
    }
});

// Launch a quiz (Set status to LIVE)
router.post("/:id/launch", auth, async (req, res, next) => {
    try {
        const { id } = req.params;

        const quiz = await req.prisma.quiz.findUnique({
            where: { id },
            include: { session: true }
        });

        if (!quiz) {
            return res.status(404).json({ error: "Quiz not found" });
        }

        if (quiz.creatorId !== req.user.id) {
            return res.status(403).json({ error: "Not authorized" });
        }

        const updatedQuiz = await req.prisma.quiz.update({
            where: { id },
            data: {
                status: 'LIVE',
                isLive: true,
                launchedAt: new Date(),
                availableDuring: true
            }
        });

        // Notify session attendees (Optional - can be added later)

        res.json({ success: true, quiz: updatedQuiz });
    } catch (error) {
        next(error);
    }
});

// Get quizzes for a session (for Mentor to view their quizzes)
router.get("/session/:sessionId", auth, async (req, res, next) => {
    try {
        const { sessionId } = req.params;

        const quizzes = await req.prisma.quiz.findMany({
            where: { sessionId },
            include: {
                questions: true,
                _count: {
                    select: { attempts: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ success: true, quizzes });
    } catch (error) {
        next(error);
    }
});

// Get quiz for attempt (Learner view - No correct answers)
router.get("/:id/attempt", auth, async (req, res, next) => {
    try {
        const { id } = req.params;

        const quiz = await req.prisma.quiz.findUnique({
            where: { id },
            include: {
                questions: {
                    select: {
                        id: true,
                        questionText: true,
                        options: true,
                        marks: true,
                        order: true
                        // Exclude correctAnswer
                    },
                    orderBy: { order: 'asc' }
                },
                session: {
                    select: {
                        id: true,
                        title: true,
                        mentor: {
                            select: { name: true }
                        }
                    }
                }
            }
        });

        if (!quiz) {
            return res.status(404).json({ error: "Quiz not found" });
        }

        if (quiz.status !== 'LIVE') {
            return res.status(400).json({ error: "Quiz is not live" });
        }

        // Check if user has booked the session
        const booking = await req.prisma.booking.findUnique({
            where: {
                userId_sessionId: {
                    userId: req.user.id,
                    sessionId: quiz.sessionId
                }
            }
        });

        if (!booking) {
            return res.status(403).json({ error: "You must be registered for the session to take this quiz" });
        }

        // Check if already attempted
        const existingAttempt = await req.prisma.quizAttempt.findFirst({
            where: {
                quizId: id,
                userId: req.user.id
            }
        });

        if (existingAttempt) {
            return res.status(400).json({ error: "You have already attempted this quiz", attempt: existingAttempt });
        }

        res.json({ success: true, quiz });
    } catch (error) {
        next(error);
    }
});

// Submit quiz attempt
router.post("/:id/submit", auth, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { answers } = req.body; // { questionId: selectedOption }

        const quiz = await req.prisma.quiz.findUnique({
            where: { id },
            include: { questions: true }
        });

        if (!quiz) {
            return res.status(404).json({ error: "Quiz not found" });
        }

        // Calculate score
        let score = 0;
        const totalMarks = quiz.totalMarks;
        const attemptAnswers = [];

        quiz.questions.forEach(question => {
            const selectedOption = answers[question.id];
            const isCorrect = selectedOption === question.correctAnswer;

            if (isCorrect) {
                score += question.marks;
            }

            attemptAnswers.push({
                questionId: question.id,
                selectedAnswer: selectedOption || '',
                isCorrect,
                marksObtained: isCorrect ? question.marks : 0
            });
        });

        const isPassed = score >= quiz.passingMarks;

        // Create attempt record
        const attempt = await req.prisma.quizAttempt.create({
            data: {
                userId: req.user.id,
                quizId: id,
                score,
                totalMarks,
                isPassed,
                submittedAt: new Date(),
                answers: {
                    create: attemptAnswers
                }
            }
        });

        res.json({
            success: true,
            result: {
                score,
                totalMarks,
                isPassed,
                passingMarks: quiz.passingMarks,
                answers: attemptAnswers.map(a => ({
                    questionId: a.questionId,
                    selectedAnswer: a.selectedAnswer,
                    isCorrect: a.isCorrect,
                    correctAnswer: quiz.questions.find(q => q.id === a.questionId).correctAnswer,
                    explanation: quiz.questions.find(q => q.id === a.questionId).explanation
                }))
            }
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
