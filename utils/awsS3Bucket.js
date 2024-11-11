const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const { v4: uuidv4 } = require("uuid"); // For unique file names

// Initialize S3 client
const s3 = new S3Client({
	region: process.env.AWS_REGION,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	},
});

const s3Upload = async (files, folderName) => {
	const uploadPromises = files.map((file) => {
		const params = {
			Bucket: process.env.S3_BUCKET_NAME,
			Key: `${process.env.WEBSITE_NAME}-storage/${folderName}/${uuidv4()}_${
				file.originalname
			}`, // Unique file name
			Body: file.buffer,
			ContentType: file.mimetype,
			// ACL: "public-read", // Allows public access if needed
		};

		const upload = new Upload({
			client: s3,
			params,
		});
		;
		return upload.done();
	});

	return Promise.all(uploadPromises);
};

module.exports = { s3Upload };
