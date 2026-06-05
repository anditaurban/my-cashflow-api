const router = require('express').Router();
const paymentMethodsController = require('../controllers/paymentMethodsController');
const asyncHandler = require('../middleware/asyncHandler');

router.get('/', asyncHandler(paymentMethodsController.listPaymentMethods));

module.exports = router;
