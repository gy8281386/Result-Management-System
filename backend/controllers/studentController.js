const db = require('../config/db');

exports.getMyResults = async (req, res) => {
    const student_id = req.user.user_id;
    try {
        const [results] = await db.query('SELECT subject_name, marks_obtained, total_marks, semester FROM results WHERE student_id = ? ORDER BY semester ASC', [student_id]);
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: "Error fetching results." });
    }
};

// NAYA FUNCTION: Profile Data Dene Ke Liye
exports.getProfile = async (req, res) => {
    const student_id = req.user.user_id;
    try {
        // Password, address aur parent_email exclude kar diya gaya hai
        const [profile] = await db.query('SELECT user_id, name, father_name, mother_name, phone, dob, course_class, semester, email FROM users WHERE user_id = ? AND role="student"', [student_id]);
        if (profile.length > 0) res.json(profile[0]);
        else res.status(404).json({ message: "Profile data not found." });
    } catch (error) {
        res.status(500).json({ message: "Error fetching profile." });
    }
};