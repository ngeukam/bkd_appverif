const {
	initiateWithdraw,
	getWithdrawals,
	approveWithdraw,
	getWithdrawsAdmin,
	delWithdraw,
	updateWithdraw
} = require("../../controllers/withdraw.controller");
const { Router } = require("express");
const { userAuth } = require("../../auth");
const withdrawRoutes = Router();
withdrawRoutes.post("/request", userAuth({ isAuth: true }), initiateWithdraw);
withdrawRoutes.get("/retrieve", userAuth({ isAuth: true }), getWithdrawals);
withdrawRoutes.post("/approved", userAuth({ isAdmin: true }), approveWithdraw);
withdrawRoutes.post("/delete", userAuth({ isAdmin: true }), delWithdraw);
withdrawRoutes.get("/retrieve-all", userAuth({ isAdmin: true }), getWithdrawsAdmin);
withdrawRoutes.post("/update", userAuth({ isAdmin: true }), updateWithdraw);
module.exports = withdrawRoutes;
