const {model, Schema} = require('mongoose')
const paginate = require('mongoose-paginate-v2')
const aggregatePaginate = require('mongoose-aggregate-paginate-v2')

const schema = new Schema({
        question: {
            type: String,
        },
        response: {
            type: String,
        },
    }, {timestamps: true}
);

schema.plugin(paginate)
schema.plugin(aggregatePaginate)
const Faq = model('faq', schema);

module.exports = Faq;

