const multer = require("multer");
const {s3Upload} = require("./awsS3Bucket")

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
	// Only allow PNG, JPEG, and JPG
	const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
	if (allowedTypes.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE"), false);
	}
};

// Configure multer with the storage, file filter, and limits
const upload = multer({
	storage,
	fileFilter,
	limits: { fileSize: 50 * 1024, files: 2 }, // Set max file size to 50Ko and limit to 2 files
});
module.exports = upload;
