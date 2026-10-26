const db = require('../config/db');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

exports.publishResult = async (req, res) => {
    const { course_class, semester } = req.body;
    if (!course_class || !semester) return res.status(400).json({ message: "Class & Semester required." });

    try {
        const [students] = await db.query('SELECT user_id, name, email, parent_email, father_name, dob FROM users WHERE role = "student" AND course_class = ?', [course_class]);
        if (students.length === 0) return res.status(404).json({ message: "No students found in this class." });

        let emailsSent = 0;

        for (let student of students) {
            const student_id = student.user_id;
            const [marks] = await db.query('SELECT subject_name, marks_obtained, total_marks FROM results WHERE student_id = ? AND semester = ?', [student_id, semester]);

            if (marks.length > 0) {
                const doc = new PDFDocument({ margin: 50 });
                const pdfPath = path.join(__dirname, '../uploads/', `${student_id}_Sem_${semester}.pdf`);
                doc.pipe(fs.createWriteStream(pdfPath));

                // --- BEAUTIFUL PDF FORMATTING ---
                doc.fontSize(22).font('Helvetica-Bold').fillColor('#1e3a8a').text('SMART RESULT MANAGEMENT SYSTEM', { align: 'center' });
                doc.fontSize(12).font('Helvetica').fillColor('#64748b').text('Official Academic Marksheet', { align: 'center' }).moveDown(2);

                // Student Details Box
                doc.rect(50, 120, 500, 90).stroke('#cbd5e1');
                doc.fillColor('#000').fontSize(11).font('Helvetica-Bold').text('STUDENT PROFILE', 60, 130);
                doc.font('Helvetica').fontSize(10);

                // Left Column
                doc.text(`Name: ${student.name}`, 60, 150);
                doc.text(`Roll No: ${student_id}`, 60, 170);
                doc.text(`Class: ${course_class}`, 60, 190);

                // Right Column
                doc.text(`Semester: ${semester}`, 300, 150);
                doc.text(`Father's Name: ${student.father_name || '-'}`, 300, 170);
                let dobText = student.dob ? new Date(student.dob).toLocaleDateString() : '-';
                doc.text(`Date of Birth: ${dobText}`, 300, 190);

                doc.moveDown(4);

                // Marks Table Header
                doc.font('Helvetica-Bold').fontSize(11);
                doc.text('SUBJECT', 60, 240);
                doc.text('MAX MARKS', 300, 240);
                doc.text('OBTAINED', 420, 240);
                doc.moveTo(50, 260).lineTo(550, 260).stroke('#cbd5e1');

                let y = 275;
                let totalObtained = 0, grandTotal = 0;

                doc.font('Helvetica').fontSize(10);
                marks.forEach(m => {
                    doc.text(m.subject_name, 60, y);
                    doc.text(m.total_marks.toString(), 300, y);
                    doc.text(m.marks_obtained.toString(), 420, y);
                    totalObtained += m.marks_obtained;
                    grandTotal += m.total_marks;
                    y += 20;
                });

                doc.moveTo(50, y).lineTo(550, y).stroke('#cbd5e1');
                y += 15;

                // Final Score & Percentage
                doc.font('Helvetica-Bold').fontSize(11).text('TOTAL:', 60, y);
                doc.text(grandTotal.toString(), 300, y);
                doc.text(totalObtained.toString(), 420, y);

                const percentage = ((totalObtained / grandTotal) * 100).toFixed(2);
                y += 35;
                doc.fontSize(14).fillColor('#1e3a8a').text(`PERCENTAGE: ${percentage}%`, 60, y);

                const isPass = percentage >= 33;
                doc.fillColor(isPass ? 'green' : 'red').text(`STATUS: ${isPass ? 'PASS' : 'FAIL'}`, 400, y);

                doc.end();
                // --- END PDF FORMATTING ---

                let toEmails = [];
                if (student.email) toEmails.push(student.email);
                if (student.parent_email) toEmails.push(student.parent_email);

                if (toEmails.length > 0) {
                    await transporter.sendMail({
                        from: process.env.EMAIL_USER,
                        to: toEmails.join(','),
                        subject: `Result Declared: ${course_class} - Semester ${semester}`,
                        text: `Dear ${student.name} and Parents,\nPlease find the attached official marksheet for Semester ${semester}.`,
                        attachments: [{ filename: `${student_id}_Sem_${semester}.pdf`, path: pdfPath }]
                    });
                    emailsSent++;
                }
                setTimeout(() => { if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath); }, 2500);
            }
        }

        await db.query(`INSERT INTO notices (title, date_posted) VALUES (?, CURDATE())`, [`🎉 Result Announced for ${course_class} - Semester ${semester}`]);
        res.status(200).json({ message: `Successfully emailed printed marksheets to ${emailsSent} students/parents!` });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error during bulk publishing." });
    }
};