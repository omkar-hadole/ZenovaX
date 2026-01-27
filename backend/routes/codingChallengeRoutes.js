const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const codingChallengeController = require('../controllers/codingChallengeController');

router.post('/create', auth, codingChallengeController.createCodingQuestion);
router.post('/execute', auth, require('../controllers/codingExecutionController').executeCode);
router.put('/:id/launch', auth, codingChallengeController.launchCodingQuestion);
router.get('/session/:sessionId', auth, codingChallengeController.getCodingQuestionsBySession);
router.get('/:id', auth, codingChallengeController.getCodingQuestionById);
router.post('/:id/submit', auth, codingChallengeController.submitCodingQuestion);

module.exports = router;
