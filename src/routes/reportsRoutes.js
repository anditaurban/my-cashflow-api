const router = require('express').Router();
const reportsController = require('../controllers/reportsController');
const asyncHandler = require('../middleware/asyncHandler');

router.get('/summary', asyncHandler(reportsController.getReportSummary));
router.get('/categories', asyncHandler(reportsController.getReportCategories));
router.get('/transactions', asyncHandler(reportsController.getReportTransactions));

module.exports = router;
