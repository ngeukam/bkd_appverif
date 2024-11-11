const { connection, model, Schema } = require("mongoose");
const paginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

let schema = new Schema(
	{
		user: {
			type: Schema.Types.ObjectId,
			ref: "user",
		},
		amount: {
			type: Number,
			min: 0,
		},
		deposit_method: String,
		reason: String,
		supply_date: {
			type: Date,
			default: Date.now,
		},
	},
	{ timestamps: true }
);

schema.plugin(paginate);
schema.plugin(aggregatePaginate);
const Wallet = model("wallet", schema);
module.exports = Wallet;
