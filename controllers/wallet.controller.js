const Wallet = require("../models/wallet.model");
const mongoose = require("mongoose");
const User = require("../models/user.model");
// Add funds to a wallet
const addFunds = async (req, res) => {
	console.log(req.body)
	const { userId, amount, reason, depositMethod } = req.body;
	if (!userId || !amount || !reason) {
		return res.status(400).json({
		  error: true,
		  msg: "Missing required fields: userId, amount, reason",
		});
	  }
	  const user = await User.findById(userId);
	  if (!user) {
		return res.status(404).json({
		  error: true,
		  msg: "User not found",
		});
	  }
	if (amount <= 0) {
		return res
			.status(400)
			.json({ msg: "Amount should be a positive number" });
	}

	try {
		const walletTransaction = new Wallet({
			user: userId,
			amount,
			deposit_method: depositMethod || "cash", // Default to 'cash' if not provided
		});

		await walletTransaction.save();
		res.status(200).json({
			msg: "Funds added successfully",
			transaction: walletTransaction,
		});
	} catch (error) {
		console.error("Error adding funds:", error);
		res.status(500).json({ message: "Error adding funds" });
	}
};

// Get wallet transaction history with pagination
const getWalletHistory = async (req, res) => {
	const { page = 1, limit = 10, userId } = req.query;

	try {
		const options = {
			page: parseInt(page, 10),
			limit: parseInt(limit, 10),
			sort: { createdAt: -1 },
			populate: { path: "user", select: "name email" }, // Populates user data (name and email)
		};

		const walletHistory = await Wallet.paginate({ user: userId }, options);
		res.status(200).json(walletHistory);
	} catch (error) {
		console.error("Error fetching wallet history:", error);
		res.status(500).json({ message: "Error fetching wallet history" });
	}
};

// Get wallet balance for a specific user
const getWalletBalance = async (req, res) => {
	try {
		let { _id } = res.locals.user || {};
		let user = await User.findById(_id);
		if (!user) {
			return res.status(400).json({
				success: false,
				message: "Permission Denied",
			});
		}
		const balance = await Wallet.aggregate([
			{ $match: { user: new mongoose.Types.ObjectId(user._id) } },
			{ $group: { _id: "$user", totalBalance: { $sum: "$amount" } } },
		]);
		const totalBalance = balance.length > 0 ? balance[0].totalBalance : 0;
		res.status(200).json({ balance: totalBalance });
	} catch (error) {
		console.error("Error fetching wallet balance:", error);
		res.status(500).json({ message: "Error fetching wallet balance" });
	}
};


  
module.exports = {
	getWalletBalance,
	getWalletHistory,
	addFunds,
};
