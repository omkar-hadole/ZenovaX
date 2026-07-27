const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const logger = require("../utils/logger");
const { validateCreateQuiz, validateEditQuiz, validateSubmitQuiz } = require("../utils/quizValidation");

router.post("/create", protect, authorize('MENTOR', 'BOTH'), async (req, res, next) => {
    try {
        const validation = validateCreateQuiz(req.body);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }
        const { sessionId, title, description, duration, totalMarks, passingMarks, questions } = validation.data;

        const session = await req.prisma.session.findUnique({
            where: { id: sessionId }
        });

        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }

        if (session.mentorId !== req.user.id) {
            return res.status(403).json({ error: "Not authorized to create quiz for this session" });
        }

        if (passingMarks > totalMarks) {
            return res.status(400).json({ error: "Passing marks cannot exceed total marks" });
        }

        const quiz = await req.prisma.quiz.create({
            data: {
                title,
                description: description || '',
                duration: duration,
                totalMarks,
                passingMarks,
                status: 'DRAFT',
                session: { connect: { id: sessionId } },
                creator: { connect: { id: req.user.id } },
                questions: {
                    create: questions.map((q, index) => ({
                        questionText: q.questionText,
                        options: JSON.stringify(q.options),
                        correctAnswer: q.correctAnswer,
                        marks: q.marks,
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

router.put("/:id/edit", protect, authorize('MENTOR', 'BOTH'), async (req, res, next) => {
    try {
        const validation = validateEditQuiz(req.body);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        const { id } = req.params;
        const quiz = await req.prisma.quiz.findUnique({
            where: { id },
            include: { questions: true }
        });

        if (!quiz) {
            return res.status(404).json({ error: "Quiz not found" });
        }

        if (quiz.creatorId !== req.user.id) {
            return res.status(403).json({ error: "Not authorized to edit this quiz" });
        }

        if (quiz.status === 'LIVE' || quiz.status === 'CLOSED') {
            return res.status(400).json({ error: `Cannot edit a quiz with status ${quiz.status}` });
        }

        const { title, description, duration, totalMarks, passingMarks, questions } = validation.data;

        if (totalMarks !== undefined && passingMarks !== undefined && passingMarks > totalMarks) {
            return res.status(400).json({ error: "Passing marks cannot exceed total marks" });
        }

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (duration !== undefined) updateData.duration = duration;
        if (totalMarks !== undefined) updateData.totalMarks = totalMarks;
        if (passingMarks !== undefined) updateData.passingMarks = passingMarks;

        if (questions) {
            await req.prisma.question.deleteMany({ where: { quizId: id } });

            await req.prisma.quiz.update({
                where: { id },
                data: {
                    ...updateData,
                    questions: {
                        create: questions.map((q, index) => ({
                            questionText: q.questionText,
                            options: JSON.stringify(q.options),
                            correctAnswer: q.correctAnswer,
                            marks: q.marks,
                            order: index + 1
                        }))
                    }
                }
            });
        } else {
            await req.prisma.quiz.update({
                where: { id },
                data: updateData
            });
        }

        const updatedQuiz = await req.prisma.quiz.findUnique({
            where: { id },
            include: { questions: true }
        });

        res.json({ success: true, quiz: updatedQuiz });
    } catch (error) {
        next(error);
    }
});

router.delete("/:id", protect, authorize('MENTOR', 'BOTH'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const quiz = await req.prisma.quiz.findUnique({
            where: { id },
            include: { _count: { select: { attempts: true } } }
        });

        if (!quiz) {
            return res.status(404).json({ error: "Quiz not found" });
        }

        if (quiz.creatorId !== req.user.id) {
            return res.status(403).json({ error: "Not authorized to delete this quiz" });
        }

        if (quiz.status === 'LIVE') {
            return res.status(400).json({ error: "Cannot delete a LIVE quiz. Close it first." });
        }

        if (quiz._count.attempts > 0) {
            return res.status(400).json({ error: "Cannot delete a quiz with existing attempts" });
        }

        await req.prisma.quiz.delete({ where: { id } });
        res.json({ success: true, message: "Quiz deleted successfully" });
    } catch (error) {
        next(error);
    }
});

router.post("/:id/launch", protect, authorize('MENTOR', 'BOTH'), async (req, res, next) => {
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

        if (quiz.status !== 'DRAFT') {
            return res.status(400).json({ error: `Cannot launch a quiz with status ${quiz.status}` });
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

        try {
            const bookings = await req.prisma.booking.findMany({
                where: { sessionId: quiz.sessionId, status: 'CONFIRMED' },
                select: { userId: true }
            });
            if (bookings.length > 0) {
                await req.prisma.notification.createMany({
                    data: bookings.map(({ userId }) => ({
                        userId,
                        type: 'QUIZ_LAUNCHED',
                        title: 'Quiz is live',
                        message: `"${quiz.title}" is now live for "${quiz.session.title}".`,
                        link: `/quiz/${id}/attempt`
                    }))
                });
            }
        } catch (notifyError) {
            logger.error('Failed to notify learners of quiz launch:', notifyError);
        }

        res.json({ success: true, quiz: updatedQuiz });
    } catch (error) {
        next(error);
    }
});

router.post("/:id/close", protect, authorize('MENTOR', 'BOTH'), async (req, res, next) => {
    try {
        const { id } = req.params;

        const quiz = await req.prisma.quiz.findUnique({ where: { id } });

        if (!quiz) {
            return res.status(404).json({ error: "Quiz not found" });
        }

        if (quiz.creatorId !== req.user.id) {
            return res.status(403).json({ error: "Not authorized to close this quiz" });
        }

        if (quiz.status !== 'LIVE') {
            return res.status(400).json({ error: `Cannot close a quiz with status ${quiz.status}` });
        }

        const updatedQuiz = await req.prisma.quiz.update({
            where: { id },
            data: {
                status: 'CLOSED',
                isLive: false,
                closedAt: new Date()
            }
        });

        res.json({ success: true, quiz: updatedQuiz });
    } catch (error) {
        next(error);
    }
});

router.get("/session/:sessionId", protect, async (req, res, next) => {
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

router.get("/:id", protect, async (req, res, next) => {
    try {
        const { id } = req.params;

        const quiz = await req.prisma.quiz.findUnique({
            where: { id },
            include: {
                questions: {
                    orderBy: { order: 'asc' }
                },
                session: {
                    select: { id: true, title: true }
                }
            }
        });

        if (!quiz) {
            return res.status(404).json({ error: "Quiz not found" });
        }

        const quizData = {
            ...quiz,
            questions: quiz.questions.map(q => ({
                ...q,
                options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
            }))
        };

        res.json({ success: true, quiz: quizData });
    } catch (error) {
        next(error);
    }
});

router.get("/:id/attempt", protect, async (req, res, next) => {
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
                        correctAnswer: true,
                        explanation: true,
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

        const existingAttempt = await req.prisma.quizAttempt.findFirst({
            where: {
                quizId: id,
                userId: req.user.id
            },
            include: {
                answers: true
            }
        });

        if (existingAttempt) {
            const questions = quiz.questions.map(q => ({
                ...q,
                options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
            }));

            const stats = await req.prisma.quizAttempt.aggregate({
                where: { quizId: id },
                _avg: { score: true }
            });

            const averageScore = stats._avg.score ? parseFloat(stats._avg.score.toFixed(1)) : existingAttempt.score;

            return res.json({
                success: true,
                alreadyAttempted: true,
                attempt: {
                    id: existingAttempt.id,
                    score: existingAttempt.score,
                    totalMarks: existingAttempt.totalMarks,
                    isPassed: existingAttempt.isPassed,
                    timeTaken: existingAttempt.timeTaken,
                    startedAt: existingAttempt.startedAt,
                    submittedAt: existingAttempt.submittedAt,
                    averageScore,
                    answers: existingAttempt.answers.map(a => ({
                        questionId: a.questionId,
                        selectedAnswer: a.selectedAnswer,
                        isCorrect: a.isCorrect,
                        marksObtained: a.marksObtained,
                        correctAnswer: questions.find(q => q.id === a.questionId)?.correctAnswer || '',
                        explanation: questions.find(q => q.id === a.questionId)?.explanation || null,
                        marks: questions.find(q => q.id === a.questionId)?.marks || 0
                    }))
                },
                quiz
            });
        }

        if (quiz.status !== 'LIVE') {
            return res.status(400).json({ error: "Quiz is not currently live" });
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

        res.json({ success: true, quiz });
    } catch (error) {
        next(error);
    }
});

router.post("/:id/submit", protect, async (req, res, next) => {
    try {
        const validation = validateSubmitQuiz(req.body);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        const { id } = req.params;
        const { answers, startedAt } = validation.data;

        const quiz = await req.prisma.quiz.findUnique({
            where: { id },
            include: { questions: true }
        });

        if (!quiz) {
            return res.status(404).json({ error: "Quiz not found" });
        }

        if (quiz.status !== 'LIVE') {
            return res.status(400).json({ error: "Quiz is not currently live" });
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
        const submittedAt = new Date();
        let timeTaken = null;

        if (startedAt) {
            const startDate = new Date(startedAt);
            if (!isNaN(startDate.getTime()) && startDate < submittedAt) {
                timeTaken = Math.floor((submittedAt - startDate) / 1000);
            }
        }

        await req.prisma.quizAttempt.create({
            data: {
                userId: req.user.id,
                quizId: id,
                score,
                totalMarks,
                isPassed,
                startedAt: startedAt ? new Date(startedAt) : undefined,
                submittedAt,
                timeTaken,
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

        const questionsMap = {};
        quiz.questions.forEach(q => {
            questionsMap[q.id] = q;
        });

        res.json({
            success: true,
            result: {
                score,
                totalMarks,
                isPassed,
                passingMarks: quiz.passingMarks,
                averageScore,
                timeTaken,
                answers: attemptAnswers.map(a => ({
                    questionId: a.questionId,
                    selectedAnswer: a.selectedAnswer,
                    isCorrect: a.isCorrect,
                    correctAnswer: questionsMap[a.questionId].correctAnswer,
                    explanation: questionsMap[a.questionId].explanation,
                    marksObtained: a.marksObtained,
                    marks: questionsMap[a.questionId].marks
                }))
            }
        });
    } catch (error) {
        next(error);
    }
});

router.get("/:id/results", protect, authorize('MENTOR', 'BOTH'), async (req, res, next) => {
    try {
        const { id } = req.params;

        const quiz = await req.prisma.quiz.findUnique({
            where: { id },
            include: {
                questions: {
                    orderBy: { order: 'asc' }
                },
                attempts: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                profilePicture: true
                            }
                        },
                        answers: {
                            include: {
                                question: true
                            }
                        }
                    },
                    orderBy: { submittedAt: 'desc' }
                }
            }
        });

        if (!quiz) {
            return res.status(404).json({ error: "Quiz not found" });
        }

        if (quiz.creatorId !== req.user.id) {
            return res.status(403).json({ error: "Not authorized to view results for this quiz" });
        }

        const effectivePassingMarks = quiz.passingMarks > 0 ? quiz.passingMarks : Math.max(1, Math.round(quiz.totalMarks * 0.4));

        const questionStats = quiz.questions.map(question => {
            const answersForQuestion = quiz.attempts.flatMap(a =>
                a.answers.filter(ans => ans.questionId === question.id)
            );
            const totalResponses = answersForQuestion.length;
            const correctCount = answersForQuestion.filter(a => a.isCorrect).length;
            const incorrectCount = totalResponses - correctCount;
            const successRate = totalResponses > 0 ? Math.round((correctCount / totalResponses) * 100) : 0;

            const optionBreakdown = {};
            try {
                const options = typeof question.options === 'string' ? JSON.parse(question.options) : question.options;
                options.forEach(opt => {
                    optionBreakdown[opt] = answersForQuestion.filter(a => a.selectedAnswer === opt).length;
                });
            } catch (e) {
                // ignore parse errors
            }

            return {
                questionId: question.id,
                questionText: question.questionText,
                marks: question.marks,
                correctAnswer: question.correctAnswer,
                totalResponses,
                correctCount,
                incorrectCount,
                successRate,
                optionBreakdown
            };
        });

        const attempts = quiz.attempts.map(attempt => ({
            id: attempt.id,
            user: attempt.user,
            score: attempt.score,
            totalMarks: attempt.totalMarks,
            isPassed: attempt.score >= effectivePassingMarks,
            percentage: attempt.totalMarks > 0 ? Math.round((attempt.score / attempt.totalMarks) * 100) : 0,
            timeTaken: attempt.timeTaken,
            startedAt: attempt.startedAt,
            submittedAt: attempt.submittedAt
        }));

        const totalAttempts = attempts.length;
        const passedCount = attempts.filter(a => a.score >= effectivePassingMarks).length;
        const failedCount = totalAttempts - passedCount;
        const passRate = totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 100) : 0;
        const averageScore = totalAttempts > 0
            ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts)
            : 0;

        res.json({
            success: true,
            quiz: {
                id: quiz.id,
                title: quiz.title,
                description: quiz.description,
                duration: quiz.duration,
                totalMarks: quiz.totalMarks,
                passingMarks: quiz.passingMarks,
                status: quiz.status
            },
            stats: {
                totalAttempts,
                passedCount,
                failedCount,
                passRate,
                averageScore
            },
            questionStats,
            attempts
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
