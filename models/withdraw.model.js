const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);
const { Schema, model } = mongoose;
const paginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const withdrawSchema = new Schema({
  amount: {
    type: Number,
    default: 0,
  },
  by: {
    type: Schema.Types.ObjectId,
    ref: "user",
  },
  trx_id: String,
  approved: {
    type: Boolean,
    default: false,
  },
  payment_accept: {
    method_name: String,
  },
  status: {
    type: String,
    enum: ["completed", "pending", "cancelled", "processing"],
    default: "pending",
  },
  account_details: String,
}, { timestamps: true });

withdrawSchema.plugin(paginate);
withdrawSchema.plugin(aggregatePaginate);
withdrawSchema.plugin(AutoIncrement, { inc_field: "ref" });
const Withdraw = model("Withdraw", withdrawSchema);
module.exports = Withdraw;
