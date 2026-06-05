const router = require('express').Router();
const transactionsController = require('../controllers/transactionsController');
const asyncHandler = require('../middleware/asyncHandler');

router.get('/', asyncHandler(transactionsController.listTransactions));
router.post('/', asyncHandler(transactionsController.createTransaction));
router.put('/:id', asyncHandler(transactionsController.updateTransaction));
router.delete('/:id', asyncHandler(transactionsController.deleteTransaction));

module.exports = router;
