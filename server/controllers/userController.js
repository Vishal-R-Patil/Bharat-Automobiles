// controllers/userController.js
const db = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// 1. Register a new user (Owner or Developer)
const registerUser = async (req, res) => {
    try {
        const { username, password, role } = req.body;

        // Check if user already exists
        const [existingUsers] = await db.query('SELECT * FROM Users WHERE username = ?', [username]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: "Username already exists!" });
        }

        // 🔒 The Magic: Hash the password before saving!
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Save to database
        const sql = `INSERT INTO Users (username, password_hash, role) VALUES (?, ?, ?)`;
        const [result] = await db.query(sql, [username, hashedPassword, role]);

        res.status(201).json({ message: "User registered securely!" });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Failed to register user" });
    }
};

// 2. Login a user
const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find the user
        const [users] = await db.query('SELECT * FROM Users WHERE username = ?', [username]);
        if (users.length === 0) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const user = users[0];

        // 🔒 Compare the typed password with the scrambled database hash
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        // 🎟️ Create the JWT (The ID Badge)
        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' } // Badge expires in 24 hours
        );

        res.status(200).json({ 
            message: "Login successful!", 
            token: token,
            role: user.role
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Failed to log in" });
    }
};

module.exports = { registerUser, loginUser };