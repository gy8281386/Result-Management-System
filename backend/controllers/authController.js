const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    const { user_id, password, role } = req.body;

    if (!user_id || !password || !role) {
        return res.status(400).json({ message: "All fields required." });
    }

    try {
        const [users] = await db.query('SELECT * FROM users WHERE user_id = ? AND role = ?', [user_id, role]);
        if (users.length === 0) return res.status(401).json({ message: "User not found or Role mismatch." });

        const user = users[0];
        let isMatch = false;

        // Handle both plain text (manual entry) and hashed passwords
        if (password === user.password) {
            isMatch = true;
        } else {
            isMatch = await bcrypt.compare(password, user.password);
        }

        if (!isMatch) return res.status(401).json({ message: "Invalid Password." });

        const token = jwt.sign(
            { id: user.id, user_id: user.user_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: "Login Successful",
            token,
            user: { name: user.name, user_id: user.user_id, role: user.role }
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};