// backend/middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Check karein ki 'uploads' folder exist karta hai ya nahi, nahi toh bana dein
const dir = './uploads';
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}

// Multer storage engine setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // File yahan save hogi
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique naam de rahe hain
    }
});

const upload = multer({ storage: storage });

module.exports = upload;