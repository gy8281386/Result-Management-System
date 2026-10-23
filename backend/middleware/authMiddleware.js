const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ message: "Token missing. Please login." });

    const actualToken = token.split(" ")[1];

    jwt.verify(actualToken, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: "Invalid or expired token." });
        req.user = decoded;
        next();
    });
};

exports.isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: "Access Denied: Admin only." });
    next();
};

exports.isTeacher = (req, res, next) => {
    if (req.user.role !== 'teacher') return res.status(403).json({ message: "Access Denied: Teacher only." });
    next();
};