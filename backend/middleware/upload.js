const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directories exist
const profilesDir = path.join(__dirname, '../uploads/profiles');
const productsDir = path.join(__dirname, '../uploads/products');

if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir, { recursive: true });
}

if (!fs.existsSync(productsDir)) {
  fs.mkdirSync(productsDir, { recursive: true });
}

// Configure storage for profiles
const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, profilesDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'profile-' + uniqueSuffix + extension);
  }
});

// Configure storage for products
const productStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, productsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'product-' + uniqueSuffix + extension);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Configure multer for profiles
const profileUpload = multer({
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file at a time
  },
  fileFilter: fileFilter
});

// Configure multer for products
const productUpload = multer({
  storage: productStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 10 // Up to 10 images per product
  },
  fileFilter: fileFilter
});

// Middleware for single profile image upload
const uploadProfileImage = profileUpload.single('profileImage');

// Middleware for multiple product images upload
const uploadProductImages = productUpload.array('images', 10);

// Error handling wrapper for profile uploads
const handleProfileUploadError = (req, res, next) => {
  uploadProfileImage(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 5MB.'
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Too many files. Only one file allowed.'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'File upload error: ' + err.message
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    next();
  });
};

// Error handling wrapper for product uploads
const handleProductUploadError = (req, res, next) => {
  uploadProductImages(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 10MB per image.'
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum 10 images allowed.'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'File upload error: ' + err.message
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    next();
  });
};

// Utility function to delete uploaded file
const deleteUploadedFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// Utility function to get profile file URL
const getProfileFileUrl = (filename) => {
  if (!filename) return null;
  return `${process.env.BASE_URL || 'http://localhost:5000'}/uploads/profiles/${filename}`;
};

// Utility function to get product file URL
const getProductFileUrl = (filename) => {
  if (!filename) return null;
  return `${process.env.BASE_URL || 'http://localhost:5000'}/uploads/products/${filename}`;
};

// Generic utility function to get file URL (backwards compatibility)
const getFileUrl = (filename, type = 'profile') => {
  if (!filename) return null;
  if (type === 'product') {
    return getProductFileUrl(filename);
  }
  return getProfileFileUrl(filename);
};

module.exports = {
  uploadProfileImage: handleProfileUploadError,
  uploadProductImages: handleProductUploadError,
  deleteUploadedFile,
  getFileUrl,
  getProfileFileUrl,
  getProductFileUrl
};
