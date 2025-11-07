const ExifReader = require('exif-reader');

/**
 * Converts DMS (Degrees Minutes Seconds) to DD (Decimal Degrees)
 * @param {Array<number>} dms - [Degrees, Minutes, Seconds]
 * @param {string} direction - N, S, E, or W
 * @returns {number} Decimal Degrees
 */
const dmsToDd = (dms, direction) => {
  if (!dms || dms.length < 3) return null;
  const degrees = dms[0];
  const minutes = dms[1];
  const seconds = dms[2];
  let dd = degrees + (minutes / 60) + (seconds / 3600);
  if (direction === 'S' || direction === 'W') {
    dd *= -1;
  }
  return dd;
};

/**
 * Extracts GPS coordinates from an image buffer's EXIF data.
 * @param {Buffer} buffer - The image file buffer.
 * @returns {Array<number>|null} [longitude, latitude] or null.
 */
exports.extractGpsCoordinates = (buffer) => {
  try {
    const tags = ExifReader.load(buffer);
    
    // Check for GPS tags
    if (!tags.GPSLatitude || !tags.GPSLongitude || !tags.GPSLatitudeRef || !tags.GPSLongitudeRef) {
      return null;
    }

    // Extract values
    const latDMS = tags.GPSLatitude.description;
    const latRef = tags.GPSLatitudeRef.description;
    const lonDMS = tags.GPSLongitude.description;
    const lonRef = tags.GPSLongitudeRef.description;

    // Convert to Decimal Degrees
    const latitude = dmsToDd(latDMS, latRef);
    const longitude = dmsToDd(lonDMS, lonRef);

    if (latitude !== null && longitude !== null) {
      return [longitude, latitude]; // GeoJSON format: [longitude, latitude]
    }
    
    return null;

  } catch (error) {
    // console.error("Error reading EXIF data:", error.message);
    return null;
  }
};