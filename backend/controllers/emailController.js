const db = require('../config/db');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// Ab ye specific bachhe ke bajaye PURI CLASS ka result nikalega
exports.publishResult = async (req, res) => {
    const { course_class, semester } = req.body;
    if (!course_class || !semester) return res.status(400).json({ message: "Class & Semester required." });

    try {
        // Us class aur sem ke sabhi students ko dhoondo
        const [students] = await db.query('SELECT user_id, name, email, parent_email FROM users WHERE role = "student" AND course_class = ? AND semester = ?', [course_class, semester]);

        if (students.length === 0) return res.status(404).json({ message: "No students found in this class & semester." });

        let emailsSent = 0;

        for (let student of students) {
            const student_id = student.user_id;
            const [marks] = await db.query('SELECT subject_name, marks_obtained, total_marks FROM results WHERE student_id = ? AND semester = ?', [student_id, semester]);

            if (marks.length > 0) {
                // Generate PDF
                const doc = new PDFDocument();
                const pdfPath = path.join(__dirname, '../uploads/', `${student_id}_Result.pdf`);
                doc.pipe(fs.createWriteStream(pdfPath));

                doc.fontSize(22).text('RESULT - LALITA SINGH INSTITUTE', { align: 'center' }).moveDown();
                doc.fontSize(14).text(`Student Name: ${student.name}`);
                doc.text(`Roll No: ${student_id} | Class: ${course_class} | Sem: ${semester}`).moveDown();
                doc.text('----------------------------------------------------');

                let totalObtained = 0, grandTotal = 0;
                marks.forEach(m => {
                    doc.text(`${m.subject_name} :  ${m.marks_obtained} / ${m.total_marks}`);
                    totalObtained += m.marks_obtained; grandTotal += m.total_marks;
                });
                doc.text('----------------------------------------------------').moveDown();
                doc.text(`Total: ${totalObtained} / ${grandTotal} | Percentage: ${((totalObtained / grandTotal) * 100).toFixed(2)}%`);
                doc.end();

                // Parents aur Student dono ko bhejna (comma separated)
                let toEmails = [];
                if (student.email) toEmails.push(student.email);
                if (student.parent_email) toEmails.push(student.parent_email);

                if (toEmails.length > 0) {
                    await transporter.sendMail({
                        from: process.env.EMAIL_USER,
                        to: toEmails.join(','),
                        subject: `Result Declared: ${course_class} - Semester ${semester}`,
                        text: `Dear ${student.name} and Parents,\nPlease find the attached marksheet.`,
                        attachments: [{ filename: `${student_id}_Result.pdf`, path: pdfPath }]
                    });
                    emailsSent++;
                }
                setTimeout(() => { if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath); }, 2000);
            }
        }

        // Home Page ke Notice Board me Notice add karna
        await db.query(`INSERT INTO notices (title, date_posted) VALUES (?, CURDATE())`, [`🎉 Result Announced for ${course_class} - Semester ${semester}`]);

        res.status(200).json({ message: `Successfully emailed results to ${emailsSent} students/parents and updated Notice Board!` });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error during bulk publishing." });
    }
};