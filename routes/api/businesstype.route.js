const {
    getBusinessTypes,
    createBusinessType,
    updateBusinessQuote,
    updateBusinessStatus,
    deleteBusinessType,
  } = require("../../controllers/business.controller");
  const { Router } = require("express");
  const { userAuth } = require("../../auth");
  const businessRoutes = Router();
  businessRoutes.get("/all", userAuth({ isAuth: true }), getBusinessTypes);
  businessRoutes.post("/create", userAuth({ isAdmin: true }), createBusinessType);
  businessRoutes.post("/update-quote", userAuth({ isAdmin: true }), updateBusinessQuote);
  businessRoutes.post("/update-status", userAuth({ isAdmin: true }), updateBusinessStatus);
  businessRoutes.post("/delete", userAuth({ isAdmin: true }), deleteBusinessType);
  module.exports = businessRoutes;
  