const express = require('express');
const router = express.Router();
const {
  getCases, getCaseById, createCase, updateCase, deleteCase, getDashboardStats
} = require('../controllers/casesController');
const { authenticate, requireAdmin, requireNotDoctor, requireAdminOrDoctor, requireCaseEditor, requireNotDelivery } = require('../middleware/auth');

router.get('/dashboard', authenticate, getDashboardStats);
router.get('/',          authenticate, getCases);
router.get('/:id',       authenticate, getCaseById);
router.post('/',         authenticate, requireNotDelivery, createCase);
router.put('/:id',       authenticate, requireCaseEditor, updateCase);
router.delete('/:id',    authenticate, requireAdminOrDoctor, deleteCase);

module.exports = router;
