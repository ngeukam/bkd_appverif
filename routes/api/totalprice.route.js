const TotalPrice = require("../../controllers/price_calculator.controller");
const { Router } = require("express");
const { userAuth } = require("../../auth");
const priceRoutes = Router();

priceRoutes.post("/total", userAuth({ isAuth: true }), TotalPrice);

module.exports = priceRoutes;
