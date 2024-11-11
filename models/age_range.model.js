const {model, Schema} = require('mongoose')
const paginate = require('mongoose-paginate-v2')
const aggregatePaginate = require('mongoose-aggregate-paginate-v2')

const schema = new Schema({
        range: {
            type: String,
            unique: true
        },
        active: {
            type: Boolean,
            default: true
        },
        parent: {
            type: Schema.Types.ObjectId,
            ref: 'age_range',
        }
    }, {timestamps: true}
);

schema.plugin(paginate)
schema.plugin(aggregatePaginate)
const Age_Range = model('age_range', schema);

module.exports = Age_Range;

