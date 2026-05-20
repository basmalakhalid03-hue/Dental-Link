const express = require('express');
const router = express.Router();
const {
  getDeliveryCases, updateDeliveryStatus, getDeliveryStats,
} = require('../controllers/deliveryController');
const { authenticate, requireDelivery } = require('../middleware/auth');

router.use(authenticate, requireDelivery);

router.get('/cases',              getDeliveryCases);
router.put('/cases/:id/status',   updateDeliveryStatus);
router.get('/stats',              getDeliveryStats);

module.exports = router;
