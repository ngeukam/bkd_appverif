const { model, Schema } = require("mongoose");
const paginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

let schema = new Schema(
	{
		name: String,
		first_name: String,
		middle_name: String,
		last_name: String,
		username: {
			type: String,
			lowercase: true,
			trim: true,
		},
		email: {
			type: String,
			unique: true,
			lowercase: true,
			trim: true,
			require:true
		},
		password: {
			type: String,
			trim: true,
		},
		phone: {
			type: String,
			trim: true,
		},
		permission: {
			type: Schema.Types.ObjectId,
			ref: "role",
		},
		country: String,
		gender: String,
		image: String,
		role: {
			type: String,
			enum: ["user", "admin", "employee"],
			default: "user",
		},
		verified: {
			type: Boolean,
			default: false,
		},
		active: {
			type: Boolean,
			default: true,
		},
		is_tester: {
			type: Boolean,
			default: false,
		},
		hobbies: [String],
		age_ranges:String,
		business_types:[String],
		phone_types: [String],
		fcm_token: [String],
		push_notification_status: {
			type: Boolean,
			default: true,
		},
		confirmationToken:String,
		resetPasswordToken:String
	},
	{ timestamps: true }
);

schema.plugin(paginate);
schema.plugin(aggregatePaginate);
const User = model("user", schema);

module.exports = User;
