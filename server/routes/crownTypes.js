const express = require('express');
const router  = express.Router();
const {
  listCrownTypes, createCrownType, reorderCrownTypes, updateCrownType, deleteCrownType,
} = require('../controllers/crownTypeController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/',          authenticate, listCrownTypes);
router.post('/',         authenticate, requireAdmin, createCrownType);
router.put('/reorder',   authenticate, requireAdmin, reorderCrownTypes);
router.put('/:id',       authenticate, requireAdmin, updateCrownType);
router.delete('/:id',    authenticate, requireAdmin, deleteCrownType);

module.exports = router;
