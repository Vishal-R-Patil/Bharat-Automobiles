// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
    // 1. Look for the "Authorization" header in the incoming request
    const authHeader = req.headers.authorization;

    // 2. If there is no header, or it doesn't start with "Bearer ", block them!
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).json({ message: "Access Denied. No digital badge provided!" });
    }

    // 3. Extract just the token part (remove the word "Bearer ")
    const token = authHeader.split(' ')[1];

    try {
        // 4. Verify the badge using your secret stamp
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 5. Attach the user's details (like role) to the request so the controller can use it later
        req.user = decoded; 
        
        // 6. The badge is valid! Let them pass to the next function.
        next(); 
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired badge." });
    }
};

module.exports = verifyToken;