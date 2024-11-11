const { model, Schema } = require("mongoose");

let schema = new Schema(
	{
		group: { type: Schema.Types.ObjectId, ref: "group" },
		status: {
			type: String,
			enum: ["sent", "scheduled", "failed"],
			default: "sent",
		},
		to_users: String,
		scheduled_date: String,
		title: String,
		body: String,
	},
	{ timestamps: true }
);

schema.plugin(paginate);
schema.plugin(aggregatePaginate);

const PushNotification = model("push_notification", schema);

module.exports = PushNotification;
