const multer = require('multer');
const multerS3 = require('multer-s3');
const s3 = require('../config/s3Config');

// S3 upload configuration
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.S3_BUCKET_NAME,
        // Remove ACL since access point handles permissions
        key: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, `Fajr_Council_Uploads/${uniqueSuffix}_${file.originalname}`);
        }
    }),
    fileFilter: (req, file, cb) => {
        // Only allow image files
        if (file.mimetype.startsWith('images/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

module.exports = upload;
