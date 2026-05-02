// routes/productRoutes.js
const express = require('express');
const router = express.Router();

//Import the gatekeeper (the authentication middleware)
const verifyToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// Import the brain (the controller functions)
const { getAllProducts, addProduct, updateProduct, deleteProduct } = require('../controllers/productController');

// Map the routes to the controller functions
//Public routes (no authentication needed)
router.get('/', getAllProducts);
//Protected routes (authentication needed)
router.post('/', verifyToken,authorizeRoles("Owner","Developer"), addProduct);
router.put('/:id', verifyToken,authorizeRoles("Owner","Developer"), updateProduct);
router.delete('/:id', verifyToken,authorizeRoles("Owner","Developer"), deleteProduct);

module.exports = router;