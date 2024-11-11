const {
	getWalletBalance,
	getWalletHistory,
	addFunds,
} = require("../../controllers/wallet.controller");
const { Router } = require("express");
const { userAuth } = require("../../auth");
const walletRoutes = Router();
walletRoutes.get("/balance", userAuth({ isAuth: true }), getWalletBalance);
walletRoutes.post("/recharge", userAuth({ isAdmin: true }), addFunds);

module.exports = walletRoutes;
