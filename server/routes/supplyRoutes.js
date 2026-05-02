// routes/supplyRoutes.js
const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/authMiddleware');
const authorizeRoles= require('../middleware/roleMiddleware');
const { receiveSupply, getSupplyHistory, getSupplyItems } = require('../controllers/supplyController');

// Only logged-in users with a valid token can POST here
router.post('/', verifyToken,authorizeRoles("Owner","Developer"), receiveSupply);
router.get('/history', verifyToken, getSupplyHistory);
router.get('/history/:id', verifyToken, getSupplyItems);

module.exports = router;