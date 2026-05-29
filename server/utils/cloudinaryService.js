const { v2: cloudinary } = require("cloudinary");

const configureCloudinary = () => {
  if (process.env.CLOUDINARY_URL) {
    try {
      const cloudinaryUrl = new URL(process.env.CLOUDINARY_URL);

      cloudinary.config({
        cloud_name: cloudinaryUrl.hostname,
        api_key: decodeURIComponent(cloudinaryUrl.username),
        api_secret: decodeURIComponent(cloudinaryUrl.password),
        secure: true,
      });
      return;
    } catch (err) {
      console.error("Invalid CLOUDINARY_URL:", err.message);
    }
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
};

configureCloudinary();

const uploadImageToCloudinary = (file) =>
  new Promise((resolve, reject) => {
    if (!file) return resolve(null);

    const config = cloudinary.config();
    if (!config.cloud_name || !config.api_key || !config.api_secret) {
      return reject(
        new Error(
          "Cloudinary credentials are missing. Set CLOUDINARY_URL or all CLOUDINARY_* variables."
        )
      );
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "bharat-automobiles/supplier-bills",
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );

    stream.end(file.buffer);
  });

const getCloudinaryPublicId = (fileUrl) => {
  const { pathname } = new URL(fileUrl);
  const uploadMarker = "/upload/";
  const uploadIndex = pathname.indexOf(uploadMarker);

  if (uploadIndex === -1) return null;

  let publicPath = pathname.slice(uploadIndex + uploadMarker.length);
  publicPath = publicPath.replace(/^v\d+\//, "");

  return publicPath.replace(/\.[^/.]+$/, "");
};

const deleteImageFromCloudinary = async (fileUrl) => {
  const publicId = getCloudinaryPublicId(fileUrl);
  if (!publicId) return null;

  return cloudinary.uploader.destroy(publicId, { resource_type: "image" });
};

module.exports = {
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
};
