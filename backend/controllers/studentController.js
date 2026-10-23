const db = require('../config/db');

exports.getMyResults = async (req, res) => {
    const student_id = req.user.user_id;

    try {
        const [results] = await db.query('SELECT subject_name, marks_obtained, total_marks, semester FROM results WHERE student_id = ? ORDER BY semester DESC', [student_id]);
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: "Error fetching results." });
    }
};