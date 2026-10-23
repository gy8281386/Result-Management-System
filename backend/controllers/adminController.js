const db = require('../config/db');
const bcrypt = require('bcrypt');

exports.addUser = async (req, res) => {
    // Frontend se saara naya data aayega
    const { user_id, password, name, email, role, father_name, mother_name, parent_email, phone, address, dob, course_class, semester, qualification } = req.body;

    if (!user_id || !password || !name || !role) {
        return res.status(400).json({ message: "Basic fields (ID, Name, Password, Role) required." });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Ek hi query me saara data daal denge (jo fields nahi aayengi wo null rahengi)
        await db.query(
            `INSERT INTO users 
            (user_id, password, name, email, role, father_name, mother_name, parent_email, phone, address, dob, course_class, semester, qualification) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, hashedPassword, name, email, role, father_name, mother_name, parent_email, phone, address, dob, course_class, semester, qualification]
        );

        res.status(201).json({ message: `${role.toUpperCase()} registered successfully!` });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: "User ID already exists." });
        console.log(error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, user_id, name, email, role, course_class, semester FROM users WHERE role != "admin"');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Database Error" });
    }
};