// routes/billingRoutes.js
const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/authMiddleware');
const { processCheckout, getSalesHistory, getTransactionItems } = require('../controllers/billingController');

// Only logged-in users can hit this route
router.post('/checkout', verifyToken, processCheckout);
// billing history
router.get('/history', verifyToken, getSalesHistory);
router.get('/history/:id', verifyToken, getTransactionItems);

module.exports = router;