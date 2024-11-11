const Payment = require("../models/payment.model");

const jwt = require("jsonwebtoken");

const getPaymentDetails = async (req, res) => {
	const { token } = req.query;

	if (!token) {
		return res.status(400).json({ message: "Access token is required" });
	}

	try {
		// Vérifiez et décodez le jeton
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const { userId, projectId } = decoded; // Assurez-vous que ces informations sont dans le jeton
		// Récupérez les détails du paiement en fonction de l'ID de l'utilisateur et de l'ID du projet
		const payment = await Payment.findOne({ user: userId, project: projectId })
			.populate("project", "name code")
			.exec();

		if (!payment) {
			return res.status(404).json({ message: "Payment not found" });
		}
		// Si le paiement est trouvé, renvoyez les détails pertinents
		res.status(200).json({
			success: true,
			totalAmount: payment.amount,
			projectName: payment.project.name,
			projectCode: payment.project.code,
		});
	} catch (error) {
		console.error("Error fetching payment details:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

module.exports = {
	getPaymentDetails,
};
