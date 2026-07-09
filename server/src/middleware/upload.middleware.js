const multer = require("multer");

const storage = multer.memoryStorage();

const imageFileFilter = (_req, file, callback) => {
  if (!file.mimetype.startsWith("image/")) {
    callback(new Error("Only image uploads are allowed"));
    return;
  }

  callback(null, true);
};

const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = upload;
