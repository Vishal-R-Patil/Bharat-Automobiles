// routes/productRoutes.js
const express = require('express');
const router = express.Router();

//Import the gatekeeper (the authentication middleware)
const verifyToken = require('../middleware/authMiddleware');

// Import the brain (the controller functions)
const { getAllProducts, addProduct, updateProduct, deleteProduct } = require('../controllers/productController');

// Map the routes to the controller functions
//Public routes (no authentication needed)
router.get('/', getAllProducts);
//Protected routes (authentication needed)
router.post('/', verifyToken, addProduct);
router.put('/:id', verifyToken, updateProduct);
router.delete('/:id', verifyToken, deleteProduct);

module.exports = router;