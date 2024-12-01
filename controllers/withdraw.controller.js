const mongoose = require("mongoose");
const Withdraw = require("../models/withdraw.model");
const Wallet = require("../models/wallet.model");
const User = require("../models/user.model");
const crypto = require("crypto");
const { sendNotification, admin } = require("../utils/pushNotifications/push");
// Initiate a withdrawal request (without deducting funds)
const initiateWithdraw = async (req, res) => {
	try {
		let { _id } = res.locals.user || {};
		let user = await User.findById(_id);
		if (!user) {
			return res.status(400).json({
				success: false,
				message: "Permission Denied",
			});
		}
		const { amount, method_name, account_details } = req.body;

		// Step 1: Find all wallets associated with the user and sum the amounts
		const totalAmount = await Wallet.aggregate([
			{ $match: { user: user._id } }, // Match wallets associated with the user
			{ $group: { _id: "$user", totalAmount: { $sum: "$amount" } } }, // Sum up the amounts
		]);
		// Step 2: Check if the user has enough funds
		if (!totalAmount.length || totalAmount[0].totalAmount < amount) {
			return res.status(400).json({ message: "Insufficient funds" });
		}
		const transaction_id =
			crypto.randomBytes(4).toString("hex") + new Date().getTime();
		// Create the withdrawal request without updating the wallet balance
		const withdraw = new Withdraw({
			amount,
			by: user._id,
			payment_accept: { method_name },
			trx_id: transaction_id,
			account_details,
		});

		await withdraw.save();
		res.status(200).json({ message: "Withdrawal request submitted", withdraw });
	} catch (error) {
		res.status(500).json({ message: "Error initiating withdrawal", error });
	}
};

// Approve a withdrawal request (deducts funds within a transaction)
const approveWithdraw = async (req, res) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		const { _id } = req.body;
		// Find the withdrawal request
		const withdraw = await Withdraw.findById(_id).session(session);
		if (!withdraw)
			return res.status(404).json({ error: true, msg: "Withdraw not found" });
		if (withdraw.approved)
			return res.status(400).json({ error: true, msg: "Already approved" });

		// Check wallet balance and deduct funds
		const wallets = await Wallet.find({ user: withdraw.by }).session(session);
		const totalAmount = wallets.reduce((sum, wallet) => sum + wallet.amount, 0);

		if (totalAmount < withdraw.amount) {
			await session.abortTransaction();
			return res.status(400).json({ error: true, msg: "Insufficient funds" });
		}

		let remainingAmount = withdraw.amount;

		for (let wallet of wallets) {
			if (remainingAmount <= 0) break;

			const amountToDeductFromWallet = Math.min(wallet.amount, remainingAmount);
			wallet.amount -= amountToDeductFromWallet;
			remainingAmount -= amountToDeductFromWallet;
			await wallet.save({ session });
		}
		const userfcm = await User.find({ _id: withdraw.by }).session(session);
		// Mark the withdrawal as approved and completed
		withdraw.approved = true;
		withdraw.status = "completed";
		await withdraw.save({ session });
		// Commit the transaction
		await session.commitTransaction();
    if (userfcm.fcm_token) {
			userfcm.fcm_token.forEach(async (token) => {
				await sendNotification(
					token,
					`Approved withdrawal`,
					`Withdrawal amount $${withdraw.amount.toLocaleString()} and Transaction Id: ${
						withdraw.trx_id
					}`
				);
			});
		}
		session.endSession();
		res.status(200).json({
			error: false,
			msg: "Withdrawal approved and funds deducted",
			withdraw,
		});
	} catch (error) {
		// Roll back the transaction in case of error
		await session.abortTransaction();
		session.endSession();
		res
			.status(500)
			.json({ error: true, msg: "Error approving withdrawal", error });
	}
};


// Get all withdrawal requests (Admin or User can filter their own)
const getWithdrawals = async (req, res) => {
	try {
		const query =
			res.locals.user.role === "admin" ? {} : { by: res.locals.user._id };
		const withdrawals = await Withdraw.paginate(query, {
			page: req.query.page || 1,
			limit: req.query.limit || 1,
			sort: { createdAt: -1 },
		});

		return res.status(200).json(withdrawals);
	} catch (error) {
		return res.status(500).json({ message: "Error fetching withdrawals", error });
	}
};

const getWithdrawsAdmin = async (req, res) => {
	try {
		const { query } = req;
		const { user } = res.locals;

		let filter = {};

		// Handle search query, if provided
		if (query.search) {
			const searchTerm = query.search.toLowerCase().trim();
			filter = {
				$or: [
					{ "user.email": { $regex: new RegExp(searchTerm, "i") } },
					{ "user.phone": { $regex: new RegExp(searchTerm, "i") } },
					{ status: { $regex: new RegExp(searchTerm, "i") } },
					{ amount: +query.search }, // Assuming this is meant to match the exact amount
				],
			};
		}

		// Handle approval status filter, if provided
		const isApproved = query.approved ? query.approved === "true" : undefined;

		// Start building the aggregation pipeline
		const pipeline = [];

		// Match by status, if provided
		if (query.status) {
			pipeline.push({
				$match: { status: query.status },
			});
		}

		// Match by approval status, if provided
		if (isApproved !== undefined) {
			pipeline.push({
				$match: { approved: isApproved },
			});
		}

		// Filter by user role
		if (user && user._id) {
			if (user.role === "employee") {
				pipeline.push({
					$match: { by: new mongoose.Types.ObjectId(user._id) },
				});
			} else if (user.role === "admin") {
				// Admins can see all withdrawals, so no additional filter is needed
				pipeline.push({
					$match: {},
				});
			}
		}

		// Lookup the 'users' collection to add user details to the withdrawal
		pipeline.push({
			$lookup: {
				from: "users",
				let: { by: "$by" },
				pipeline: [
					{
						$match: {
							$expr: {
								$eq: ["$_id", "$$by"],
							},
						},
					},
					{
						$project: {
							_id: 1,
							name: 1,
							email: 1,
							phone: 1,
							image: 1,
						},
					},
				],
				as: "by",
			},
		});

		// Unwind the 'by' array (will contain a single user or be empty)
		pipeline.push({
			$unwind: { path: "$by", preserveNullAndEmptyArrays: true },
		});

		// Apply search filter
		if (Object.keys(filter).length > 0) {
			pipeline.push({ $match: filter });
		}

		// Sort by createdAt descending
		pipeline.push({ $sort: { createdAt: -1 } });

		// Run the aggregation with pagination
		const withdraws = await Withdraw.aggregatePaginate(
			Withdraw.aggregate(pipeline),
			{
				page: query.page || 1,
				limit: query.size || 20,
			}
		);

		// Respond with the data
		return res.status(200).json({
			error: false,
			data: withdraws,
		});
	} catch (error) {
		console.error(error); // Log the error for better debugging
		return res.status(500).json({
			error: true,
			msg: "Server side error",
		});
	}
};

const updateWithdraw = async (req, res) => {
	try {
		const { body } = req;
		if (!!body?._id) {
			const withdraw = await Withdraw.findById(body?._id);
			if (withdraw.status === "completed")
				return res.status(400).json({ error: true, msg: "Already completed" });

			await Withdraw.findByIdAndUpdate(body?._id, {
				$set: {
					status: body.status,
				},
			});
			return res.status(200).json({
				error: false,
				msg: "Updated success",
			});
		}
	} catch (error) {
		return res.status(500).json({
			error: true,
			msg: "Server side error",
		});
	}
};
// delete Withdraw
const delWithdraw = async (req, res) => {
	try {
	  const { body } = req;
  
	  // Find the withdrawal by ID
	  const withdraw = await Withdraw.findById(body._id);
	  if (!withdraw) {
		return res.status(404).json({ error: true, msg: "Withdraw not found" });
	  }
  
	  // Check if withdrawal is approved or has completed status
	  if (withdraw.approved || withdraw.status === "completed") {
		return res.status(400).json({
		  error: true,
		  msg: "Cannot delete approved or completed withdrawals.",
		});
	  }
  
	  // Delete the withdrawal
	  await Withdraw.findByIdAndDelete(body._id);
  
	  return res.status(200).json({
		error: false,
		msg: "Deleted successfully",
	  });
	} catch (error) {
	  return res.status(500).json({
		error: true,
		msg: "Server side error",
	  });
	}
  };
  

module.exports = {
	initiateWithdraw,
	approveWithdraw,
	getWithdrawals,
	getWithdrawsAdmin,
	updateWithdraw,
	delWithdraw,
};
