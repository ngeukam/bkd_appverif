const { model, Schema } = require("mongoose");
const paginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
// Définition du schéma
let schema = new Schema(
	{
		tester: {
			type: Schema.Types.ObjectId,
			ref: "user",
            required:true,
		},
		project: {
			type: Schema.Types.ObjectId,
			ref: "project",
            required:true,
		},
		confirmationDate: {
			type: Date,
			default: null,
		},
		status_of_test: {
			type: String,
			enum: ["not started", "in progress", "completed"],
			default: "not started",
		},
		tester_is_paid:{
			type:Boolean,
			default: false
		}
	},
	{ timestamps: true }
);
// Ajout d'un index unique sur le couple (tester, project)
schema.index({ tester: 1, project: 1 }, { unique: true });
// Ajout des plugins pour la pagination
schema.plugin(paginate);
schema.plugin(aggregatePaginate);
const AcceptedProject = model("acceptedproject", schema);
module.exports = AcceptedProject;
