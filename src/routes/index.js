const router = require('express').Router();

router.use('/categories', require('./categoriesRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));
router.use('/payment-methods', require('./paymentMethodsRoutes'));
router.use('/reports', require('./reportsRoutes'));
router.use('/settings', require('./settingsRoutes'));
router.use('/transactions', require('./transactionsRoutes'));

module.exports = router;
