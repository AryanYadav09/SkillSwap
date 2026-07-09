const ApiError = require("./apiError");
const { cloudinary, isCloudinaryConfigured } = require("../config/cloudinary");

const uploadImageBuffer = async (file, folder) => {
  if (!file) {
    return null;
  }

  if (!isCloudinaryConfigured) {
    throw new ApiError(500, "Cloudinary is not configured");
  }

  const base64 = file.buffer.toString("base64");
  const dataUri = `data:${file.mimetype};base64,${base64}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: "image",
  });

  return result.secure_url;
};

module.exports = {
  uploadImageBuffer,
};
