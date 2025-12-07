const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

router.post("/create", auth, async (req, res, next) => {
    try {
        const { sessionId, title, description, duration, totalMarks, passingMarks, questions } = req.body;

        const session = await req.prisma.session.findUnique({
            where: { id: sessionId }
        });

        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }

        if (session.mentorId !== req.user.id) {
            return res.status(403).json({ error: "Not authorized to create quiz for this session" });
        }

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
                        options: JSON.stringify(q.options),
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


        res.json({ success: true, quiz: updatedQuiz });
    } catch (error) {
        next(error);
    }
});

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

router.post("/:id/submit", auth, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { answers } = req.body; 

        const quiz = await req.prisma.quiz.findUnique({
            where: { id },
            include: { questions: true }
        });

        if (!quiz) {
            return res.status(404).json({ error: "Quiz not found" });
        }

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



        const stats = await req.prisma.quizAttempt.aggregate({
            where: { quizId: id },
            _avg: { score: true }
        });

        const averageScore = stats._avg.score ? parseFloat(stats._avg.score.toFixed(1)) : score;

        res.json({
            success: true,
            result: {
                score,
                totalMarks,
                isPassed,
                passingMarks: quiz.passingMarks,
                averageScore,
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
