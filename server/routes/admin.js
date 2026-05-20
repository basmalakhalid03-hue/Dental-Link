const express = require('express');
const router = express.Router();
const {
  getUsers, createUser, updateUser, deleteUser, suggestTechnician, getWorkload,
} = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate, requireAdmin);

router.get('/users',              getUsers);
router.post('/users',             createUser);
router.put('/users/:id',          updateUser);
router.delete('/users/:id',       deleteUser);
router.get('/suggest-technician', suggestTechnician);
router.get('/workload',           getWorkload);

module.exports = router;
