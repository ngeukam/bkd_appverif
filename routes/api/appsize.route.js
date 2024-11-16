const {
  getAppSizes,
  createAppSize,
  updateAppSizeQuote,
  updateAppSizeStatus,
  deleteAppSize,
} = require("../../controllers/appsize.controller");
const { Router } = require("express");
const { userAuth } = require("../../auth");
const appsizeRoutes = Router();
appsizeRoutes.get("/all", userAuth({ isAuth: true }), getAppSizes);
appsizeRoutes.post("/create", userAuth({ isAdmin: true }), createAppSize);
appsizeRoutes.post("/update-quote", userAuth({ isAdmin: true }), updateAppSizeQuote);
appsizeRoutes.post("/update-status", userAuth({ isAdmin: true }), updateAppSizeStatus);
appsizeRoutes.post("/delete", userAuth({ isAdmin: true }), deleteAppSize);
module.exports = appsizeRoutes;
