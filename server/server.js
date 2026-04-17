// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
// Add this at the top with your other imports

const app = express();
app.use(cors());
app.use(express.json());

// import email services
const { startDailyReportJob } = require('./utils/emailService');
startDailyReportJob(); // Start the daily report cron job at 9PM

// Import your perfectly organized routes
const productRoutes = require('./routes/productRoutes');
// user routes
const userRoutes = require('./routes/userRoutes');
// supply routes
const supplyRoutes = require('./routes/supplyRoutes');
// billing routes
const billingRoutes = require('./routes/billingRoutes');


// Tell Express: "Any URL that starts with /api/products should use the productRoutes file"
app.use('/api/products', productRoutes);
// Tell Express: "Any URL that starts with /api/users should use the userRoutes file"
app.use('/api/users', userRoutes);

app.use('/api/supply', supplyRoutes);
// billing api
app.use('/api/billing', billingRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚗 Bharat Automobiles Server running on http://localhost:${PORT}`);
});