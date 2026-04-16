// routes/billingRoutes.js
const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/authMiddleware');
const { processCheckout } = require('../controllers/billingController');

// Only logged-in users can hit this route
router.post('/checkout', verifyToken, processCheckout);

module.exports = router;