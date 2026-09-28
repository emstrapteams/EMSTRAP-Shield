const multer = require("multer");

// Store files temporarily in memory before uploading to Cloudinary
const storage = multer.memoryStorage();

// Allow only supported image and video formats
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "video/mp4",
    "video/quicktime",
    "video/webm",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Unsupported file type. Upload JPEG, PNG, WebP, MP4, MOV, or WebM files."
      ),
      false
    );
  }
};

// Configure Multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // Maximum 100 MB per file
    files: 5, // Maximum 5 files per request
  },
});

// Middleware for uploading multiple evidence files
module.exports = upload.array("evidence", 5);