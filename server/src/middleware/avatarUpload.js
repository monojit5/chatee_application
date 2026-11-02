import multer from "multer";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1,
  },
  fileFilter(req, file, callback) {
    if (!allowedTypes.has(file.mimetype)) {
      return callback(new Error("Upload a JPG, PNG, or WebP profile photo."));
    }
    return callback(null, true);
  },
});

export function uploadAvatar(req, res, next) {
  upload.single("avatar")(req, res, (error) => {
    if (!error) return next();
    const message = error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
      ? "Profile photos must be smaller than 2 MB."
      : error.message || "Could not upload this profile photo.";
    return res.status(400).json({ message });
  });
}
