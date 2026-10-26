const db = require('../config/db');
const fs = require('fs');
const csv = require('csv-parser');

// 1. MANUAL ENTRY (Dynamic Table Se Multiple Subjects)
exports.addMarks = async (req, res) => {
    const { student_id, course_class, semester, subjects } = req.body;

    if (!student_id || !course_class || !semester || !subjects || subjects.length === 0) {
        return res.status(400).json({ message: "Details aur kam se kam ek subject bharna zaroori hai." });
    }

    try {
        // Loop chala kar saare subjects DB me daal denge
        for (let sub of subjects) {
            if (sub.subject_name && sub.marks_obtained) {
                await db.query(
                    'INSERT INTO results (student_id, semester, subject_name, marks_obtained, total_marks) VALUES (?, ?, ?, ?, ?)',
                    [student_id, semester, sub.subject_name, sub.marks_obtained, sub.total_marks || 100]
                );
            }
        }
        res.status(201).json({ message: `Student ${student_id} ke marks successfully save ho gaye!` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Marks save karte waqt error aayi." });
    }
};

// 2. BULK CSV UPLOAD (Class & Sem Frontend Form se aayenge)
exports.uploadCSV = (req, res) => {
    if (!req.file) return res.status(400).json({ message: "Please upload a CSV file." });

    const { course_class, semester } = req.body;
    if (!course_class || !semester) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: "CSV upload karte waqt Class aur Semester select karna zaroori hai." });
    }

    const results = [];
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            try {
                for (let row of results) {
                    // CSV me ab sirf 4 cheezein hongi: student_id, subject_name, marks_obtained, total_marks
                    const { student_id, subject_name, marks_obtained, total_marks } = row;
                    if (student_id && subject_name && marks_obtained) {
                        await db.query(
                            'INSERT INTO results (student_id, semester, subject_name, marks_obtained, total_marks) VALUES (?, ?, ?, ?, ?)',
                            [student_id, semester, subject_name, marks_obtained, total_marks || 100]
                        );
                    }
                }
                fs.unlinkSync(req.file.path);
                res.status(200).json({ message: `${course_class} Sem ${semester} ki CSV successfully upload ho gayi! 🎉` });
            } catch (error) {
                res.status(500).json({ message: "Error processing CSV data." });
            }
        });
};