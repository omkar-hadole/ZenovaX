const express = require('express');
const router = express.Router();
const { protect, authorize, requireProfileComplete } = require('../middleware/auth');
const codingChallengeController = require('../controllers/codingChallengeController');

router.use(protect, requireProfileComplete);

router.post('/create', authorize('MENTOR', 'BOTH'), codingChallengeController.createCodingQuestion);
router.post('/execute', require('../controllers/codingExecutionController').executeCode);
router.get('/mine', authorize('MENTOR', 'BOTH'), codingChallengeController.getCodingQuestionsByCreator);
router.put('/:id/launch', authorize('MENTOR', 'BOTH'), codingChallengeController.launchCodingQuestion);
router.put('/:id/close', authorize('MENTOR', 'BOTH'), codingChallengeController.closeCodingQuestion);
router.put('/:id', authorize('MENTOR', 'BOTH'), codingChallengeController.updateCodingQuestion);
router.get('/session/:sessionId', codingChallengeController.getCodingQuestionsBySession);
router.get('/:id/submissions/mine', codingChallengeController.getMySubmissions);
router.get('/:id', codingChallengeController.getCodingQuestionById);
router.post('/:id/submit', codingChallengeController.submitCodingQuestion);

module.exports = router;
