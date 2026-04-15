// routes/supplyRoutes.js
const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/authMiddleware');
const { receiveSupply } = require('../controllers/supplyController');

// Only logged-in users with a valid token can POST here
router.post('/', verifyToken, receiveSupply);

module.exports = router;