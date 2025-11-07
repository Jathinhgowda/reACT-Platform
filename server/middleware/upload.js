const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { extractGpsCoordinates } = require('../utils/exifHelper');
const path = require('path');

// Multer storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Convert buffer to base64 manually
const formatBufferToDataUri = (file) => {
  if (!file || !file.buffer || !file.originalname) {
    throw new Error('Invalid file object for Data URI');
  }
  // Use 'extname' for robust extension extraction
  const ext = path.extname(file.originalname).slice(1);
  const base64 = file.buffer.toString('base64');
  return `data:${file.mimetype || 'application/octet-stream'};base64,${base64}`; // Use mimetype for accuracy
};

const processUpload = (req, res, next) => {
  // Use upload.fields to listen for BOTH potential file names in the request.
  upload.fields([{ name: 'media', maxCount: 1 }, { name: 'resolutionMedia', maxCount: 1 }])(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });

    // Determine which file was actually uploaded (if any)
    const mediaFile = req.files?.media ? req.files.media[0] : null;
    const resolutionFile = req.files?.resolutionMedia ? req.files.resolutionMedia[0] : null;
    
    // The file we need to process for Cloudinary/EXIF
    const fileToProcess = mediaFile || resolutionFile;
    
    // If no file was uploaded in either field, proceed
    if (!fileToProcess) {
      req.mediaUrl = null;
      req.exifCoords = null;
      return next();
    }

    try {
      // 1. EXIF Data (only relevant for initial report files)
      if (mediaFile) {
        req.exifCoords = extractGpsCoordinates(fileToProcess.buffer);
      }
      
      // 2. Cloudinary Upload
      const fileUri = formatBufferToDataUri(fileToProcess);

      const result = await cloudinary.uploader.upload(fileUri, {
        folder: 'react_issues',
        resource_type: 'auto',
      });

      // 3. Attach URL to request body
      req.mediaUrl = result.secure_url;
      
      next();
    } catch (error) {
      console.error('Upload Error:', error);
      res.status(500).json({ message: 'Media upload failed.' });
    }
  });
};

module.exports = processUpload;