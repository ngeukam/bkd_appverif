const { Router } = require("express");
const { userAuth } = require("../../auth");
const uploadFiles = require("../../controllers/file.controller");
const upload = require("../../utils/fileFilter");

const fileRoutes = Router();

fileRoutes.post(
	"/aws",
	userAuth({ isAuth: true }),
	upload.any(),
	uploadFiles
);

module.exports = fileRoutes;
