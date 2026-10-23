const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');

const app = express();

// --- Middlewares ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Routes Import Karein ---
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const studentRoutes = require('./routes/studentRoutes');

// --- Routes Use Karein ---
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);

// --- Notice Board API (Home Page ke liye) ---
app.get('/api/notices', async (req, res) => {
    try {
        // Database se latest 5 notices fetch karega
        const [rows] = await db.query('SELECT * FROM notices ORDER BY date_posted DESC LIMIT 5');
        res.json(rows);
    } catch (error) {
        console.error("Notice Board Error:", error);
        res.status(500).json({ error: "Database error fetching notices" });
    }
});

// --- Base Test Route ---
app.get('/', (req, res) => {
    res.send("Welcome to Lalita Singh's Result Management System Backend API! 🚀");
});

// --- Server Start Karein ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} 🚀`);
});