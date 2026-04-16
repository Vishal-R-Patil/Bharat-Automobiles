// routes/supplyRoutes.js
const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/authMiddleware');
const { receiveSupply, getSupplyHistory, getSupplyItems } = require('../controllers/supplyController');

// Only logged-in users with a valid token can POST here
router.post('/', verifyToken, receiveSupply);
router.get('/history', verifyToken, getSupplyHistory);
router.get('/history/:id', verifyToken, getSupplyItems);

module.exports = router;