const {
  getAgeRanges,
  createAgeRange,
  updateAgeRangeQuote,
  deleteAgeRange,
  updateAgeRangeStatus
} = require("../../controllers/agerange.controller");
const { Router } = require("express");
const { userAuth } = require("../../auth");
const agerangeRoutes = Router();
agerangeRoutes.get("/all", userAuth({ isAuth: true }), getAgeRanges);
agerangeRoutes.post("/create", userAuth({ isAdmin: true }), createAgeRange);
agerangeRoutes.post("/update-quote", userAuth({ isAdmin: true }), updateAgeRangeQuote);
agerangeRoutes.post("/update-status", userAuth({ isAdmin: true }), updateAgeRangeStatus);
agerangeRoutes.post("/delete", userAuth({ isAdmin: true }), deleteAgeRange);
module.exports = agerangeRoutes;
