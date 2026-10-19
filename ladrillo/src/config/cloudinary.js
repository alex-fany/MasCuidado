const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Sube un buffer de imagen a Cloudinary y devuelve la URL segura
 * @param {Buffer} fileBuffer 
 * @param {string} folder 
 * @returns {Promise<string>} secure_url
 */
const uploadToCloudinary = (fileBuffer, folder = 'mascuidado') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: folder, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(fileBuffer);
  });
};

module.exports = { cloudinary, uploadToCloudinary };
