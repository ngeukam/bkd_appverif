const { getPaymentDetails } = require("../../controllers/payment.controller");
const { Router } = require("express");
const { userAuth } = require("../../auth");
const paymentsRoutes = Router();
paymentsRoutes.get("/payment-details", userAuth({ isAuth: true }), getPaymentDetails);
module.exports = paymentsRoutes;