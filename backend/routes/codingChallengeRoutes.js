const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const codingChallengeController = require('../controllers/codingChallengeController');

router.post('/create', protect, authorize('MENTOR', 'BOTH'), codingChallengeController.createCodingQuestion);
router.post('/execute', protect, require('../controllers/codingExecutionController').executeCode);
router.put('/:id/launch', protect, authorize('MENTOR', 'BOTH'), codingChallengeController.launchCodingQuestion);
router.get('/session/:sessionId', protect, codingChallengeController.getCodingQuestionsBySession);
router.get('/:id', protect, codingChallengeController.getCodingQuestionById);
router.post('/:id/submit', protect, codingChallengeController.submitCodingQuestion);

module.exports = router;
