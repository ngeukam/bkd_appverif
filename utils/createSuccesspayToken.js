const jwt = require("jsonwebtoken");

const createSuccessPayToken = (projectId, amount, userId) => {
	const payload = {
		projectId,
		amount,
		userId,
	};

	const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "10m" }); // Expire dans 10 minutes
	return token;
};
module.exports = createSuccessPayToken;
