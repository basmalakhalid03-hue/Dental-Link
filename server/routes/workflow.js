const express = require('express');
const router = express.Router();
const { listSteps, createStep, reorderSteps, updateStep, deleteStep } = require('../controllers/workflowController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Public to all authenticated users (needed for CreateCase step selection)
router.get('/steps', authenticate, listSteps);

// Admin-only mutations
router.post('/steps',          authenticate, requireAdmin, createStep);
router.put('/steps/reorder',   authenticate, requireAdmin, reorderSteps);
router.put('/steps/:id',       authenticate, requireAdmin, updateStep);
router.delete('/steps/:id',    authenticate, requireAdmin, deleteStep);

module.exports = router;
