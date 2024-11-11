const { model, Schema } = require("mongoose");
const paginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

let schema = new Schema({
        name: {
            type: String,
            unique: true,
        },
        deletable: {
            type: Boolean,
            default: true
        },
        permissions: [String],
        user: {
            type: Schema.Types.ObjectId,
            ref: 'user',
        },

    }, {timestamps: true}
)

schema.plugin(paginate)
schema.plugin(aggregatePaginate)
const Role = model('role', schema)
module.exports = Role;