const router = require('express').Router();
const settingsController = require('../controllers/settingsController');
const asyncHandler = require('../middleware/asyncHandler');

router.get('/', asyncHandler(settingsController.getSettings));
router.put('/', asyncHandler(settingsController.updateSettings));

module.exports = router;
