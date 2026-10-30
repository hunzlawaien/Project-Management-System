const multer = require("multer");

// Store uploaded images in memory before sending them to Cloudinary.
const storage = multer.memoryStorage();

// Allow only supported image formats.
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG and WebP images are allowed."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 4 * 1024 * 1024, // Maximum file size: 4MB
  },
});

module.exports = upload;
