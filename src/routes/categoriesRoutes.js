const router = require('express').Router();
const categoriesController = require('../controllers/categoriesController');
const asyncHandler = require('../middleware/asyncHandler');

router.get('/', asyncHandler(categoriesController.listCategories));
router.post('/', asyncHandler(categoriesController.createCategory));
router.put('/:id', asyncHandler(categoriesController.updateCategory));
router.delete('/:id', asyncHandler(categoriesController.deleteCategory));

module.exports = router;
