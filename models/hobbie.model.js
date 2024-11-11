const {model, Schema} = require('mongoose')
const paginate = require('mongoose-paginate-v2')
const aggregatePaginate = require('mongoose-aggregate-paginate-v2')

const schema = new Schema({
        name: {
            type: String,
            unique: true
        },
        active: {
            type: Boolean,
            default: true
        },
        parent: {
            type: Schema.Types.ObjectId,
            ref: 'hobbie',
        }
    }, {timestamps: true}
);

schema.plugin(paginate)
schema.plugin(aggregatePaginate)
const Hobbie = model('hobbie', schema);

module.exports = Hobbie;

