const { model, Schema } = require("mongoose");
const paginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

let schema = new Schema(
	{
		project: {
			type: Schema.Types.ObjectId,
			ref: "project",
			required: true,
		},
		user: {
			type: Schema.Types.ObjectId,
			ref: "user",
			required: true,
		},
		amount: {
			type: Number,
			required: true,
		},
		paymentDate: {
			type: Date,
			default: Date.now,
		},
		paymentMethod: {
			type: String,
			enum: ["cash", "paypal", "credit_card", "wallet", "other"],
			required: true,
		},
		status: {
			type: String,
			enum: ["pending", "completed", "failed"],
			default: "pending",
		},
	},
	{ timestamps: true }
);

schema.plugin(paginate);
schema.plugin(aggregatePaginate);
const Payment = model("payment", schema);

module.exports = Payment;
