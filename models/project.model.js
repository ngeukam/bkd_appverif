const { model, Schema } = require("mongoose");
const paginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
// Définition du schéma
let schema = new Schema(
	{
		name: {
			type: String,
			trim: true,
		},
		link: {
			type: String,
			trim: true,
		},
		description: {
			type: String,
			trim: true,
		},
		app_size: String,
		app_logo: String,
		app_type: {
			type: String,
			enum: ["android", "ios", "web"],
		},
		user: {
			type: Schema.Types.ObjectId,
			ref: "user",
		},
		testers: [
			{
				type: Schema.Types.ObjectId,
				ref: "user",
			},
		],
		nb_tester: Number,
		start_date: Date,
		end_date: Date,
		verified: {
			type: Boolean,
			default: false,
		},
		code: {
			type: String,
			unique: true,
			required: true,
		},
		amount: {
			type: Number,
			required: true,
		},
		commission:{
			type: Number,
			required: true,

		},
		paymentMethod: String,
		
	},
	{ timestamps: true }
);

// Ajout des plugins pour la pagination
schema.plugin(paginate);
schema.plugin(aggregatePaginate);
// Modèle Mongoose
const Project = model("project", schema);
module.exports = Project;
