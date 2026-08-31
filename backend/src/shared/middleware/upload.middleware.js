const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../../shared/config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'evently/events',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
});

function fileFilter(req, file, cb) {
  if (file.mimetype.startsWith('image/')) return cb(null, true);
  cb(new Error('Only image files are allowed'));
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
});

module.exports = upload;