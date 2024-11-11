const { model, Schema } = require("mongoose");
let schema = new Schema(
	{
		rate: {
			type: Number,
			default: 0.05,
		},
	},
	{ timestamps: true }
);

const Commission = model("commission", schema);

module.exports = Commission;
