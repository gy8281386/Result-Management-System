const db = require('../config/db');
const fs = require('fs');
const csv = require('csv-parser');

// 1. Manual Marks Entry
exports.addMarks = async (req, res) => {
    const { student_id, semester, subject_name, marks_obtained, total_marks } = req.body;

    if (!student_id || !semester || !subject_name || !marks_obtained) {
        return res.status(400).json({ message: "Fill all details." });
    }

    try {
        const defaultTotal = total_marks || 100;
        await db.query(
            'INSERT INTO results (student_id, semester, subject_name, marks_obtained, total_marks) VALUES (?, ?, ?, ?, ?)',
            [student_id, semester, subject_name, marks_obtained, defaultTotal]
        );
        res.status(201).json({ message: "Marks saved successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Error saving marks." });
    }
};

// 2. CSV Bulk Upload (Auto-fetch Class & Sem)
exports.uploadCSV = (req, res) => {
    if (!req.file) return res.status(400).json({ message: "Please upload a CSV file." });

    const results = [];
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            try {
                for (let row of results) {
                    const { student_id, subject_name, marks_obtained, total_marks } = row;

                    if (student_id && subject_name && marks_obtained) {
                        const [studentData] = await db.query('SELECT semester FROM users WHERE user_id = ? AND role="student"', [student_id]);

                        if (studentData.length > 0) {
                            const currentSem = studentData[0].semester;
                            await db.query(
                                'INSERT INTO results (student_id, semester, subject_name, marks_obtained, total_marks) VALUES (?, ?, ?, ?, ?)',
                                [student_id, currentSem, subject_name, marks_obtained, total_marks || 100]
                            );
                        }
                    }
                }
                fs.unlinkSync(req.file.path);
                res.status(200).json({ message: "Marks auto-synced with students' semesters successfully!" });
            } catch (error) {
                console.log(error);
                res.status(500).json({ message: "Error processing CSV." });
            }
        });
};