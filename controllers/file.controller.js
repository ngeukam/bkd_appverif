const User = require("../models/user.model");
const {s3Upload} = require("../utils/awsS3Bucket");

const uploadFiles = async (req, res) => {
	try {
		const { _id } = res.locals.user || {};
		const user = await User.findById(_id);
		if (!user) {
			return res.status(403).json({ error: true, msg: "Permission Denied" });
		}

		const results = (await s3Upload(req.files, user.email)).map(
			(d) => d.Location
		);
		return res.status(200).json({
			error: false,
			msg: "File uploaded successfully!",
			data: results,
		});
	} catch (error) {
		return res.status(500).json({
			error: true,
			msg: error.message,
		});
	}
};
module.exports = uploadFiles;
