const router = require('express').Router();
const dashboardController = require('../controllers/dashboardController');
const asyncHandler = require('../middleware/asyncHandler');

router.get('/summary', asyncHandler(dashboardController.getDashboardSummary));
router.get('/recent', asyncHandler(dashboardController.getRecentTransactions));
router.get('/chart', asyncHandler(dashboardController.getCashflowChart));

module.exports = router;
