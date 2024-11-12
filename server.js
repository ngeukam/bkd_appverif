const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const { decodeToken } = require("./auth");
const apiRouters = require("./routes/api");
const multer = require("multer");

const app = express();
// CORS configuration
app.use(cors({
  origin: '*',
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// MongoDB connection
mongoose
	.connect(process.env.MONGODB_URI)
	.then(() => console.log("MongoDB connected"))
	.catch((err) => console.log("MongoDB connection error:", err));

// Token decoding middleware
app.use(decodeToken);

// API routes
app.use("/api", apiRouters);
app.use("/uploads", express.static("uploads"));
// multer error handler
app.use((error, req, res, next) => {
	if (error instanceof multer.MulterError) {
		if (error.code === "LIMIT_FILE_SIZE") {
			return res.status(400).json({
				message: "file is too large",
			});
		}
		if (error.code === "LIMIT_FILE_COUNT") {
			return res.status(400).json({
				message: "File limit reached",
			});
		}
		if (error.code === "LIMIT_UNEXPECTED_FILE") {
			return res.status(400).json({
				message: "File must be an image/pdf/csv",
			});
		}
	}
});

// Welcome message
app.get("/", (req, res) => {
	return res.status(200).json({
		error: false,
		msg: "Welcome to appVerif",
	});
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
	console.error("Error:", err);
	res.status(err.status || 500).json({
		error: true,
		message: err.message || "Internal Server Error",
	});
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});