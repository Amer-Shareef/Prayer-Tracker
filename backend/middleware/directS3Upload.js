const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3 = require('../config/s3Config');
const multer = require('multer');

// Multer memory storage to handle file in memory
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Only allow image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Direct S3 upload function
const uploadToS3 = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No image file provided"
            });
        }

        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const key = `Fajr_Council_Uploads/${uniqueSuffix}_${req.file.originalname}`;

        const uploadParams = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
            ContentDisposition: 'inline'
        };

        console.log('🔄 Uploading to S3 with params:', {
            bucket: uploadParams.Bucket,
            key: uploadParams.Key,
            contentType: uploadParams.ContentType,
            size: req.file.buffer.length
        });

        const command = new PutObjectCommand(uploadParams);
        const result = await s3.send(command);

        console.log('✅ S3 upload successful:', result);

        // Construct the public URL
        const imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

        // Add the result to the request object
        req.s3Result = {
            location: imageUrl,
            key: key,
            bucket: process.env.S3_BUCKET_NAME
        };

        next();
    } catch (error) {
        console.error('❌ S3 upload error:', error);
        
        // Provide more specific error messages
        let errorMessage = 'Failed to upload image to S3';
        if (error.name === 'AccessDenied') {
            errorMessage = 'Access denied: Please check your AWS credentials and bucket permissions';
        } else if (error.name === 'NoSuchBucket') {
            errorMessage = 'S3 bucket not found';
        } else if (error.name === 'InvalidAccessKeyId') {
            errorMessage = 'Invalid AWS access key';
        }

        return res.status(500).json({
            success: false,
            message: errorMessage,
            error: error.message
        });
    }
};

module.exports = { upload, uploadToS3 };
