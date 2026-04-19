// routes/reportRoutes.js
const express = require('express');
const router = express.Router();

const { handleSendReport } = require('../utils/emailService');

// GET /api/send-report
router.get('/send-report' ,handleSendReport);

module.exports = router;