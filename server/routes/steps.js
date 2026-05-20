const express = require('express');
const router = express.Router();
const { getCaseSteps, completeStep, addNote, getWorkflowSteps } = require('../controllers/stepsController');
const { authenticate } = require('../middleware/auth');

router.get('/workflow', authenticate, getWorkflowSteps);
router.get('/case/:id', authenticate, getCaseSteps);
router.put('/:id/complete', authenticate, completeStep);
router.post('/:id/notes', authenticate, addNote);

module.exports = router;
