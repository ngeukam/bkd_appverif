const {model, Schema} = require('mongoose')
const paginate = require('mongoose-paginate-v2')
const aggregatePaginate = require('mongoose-aggregate-paginate-v2')

const schema = new Schema({
        title: {
            type: String,
        },
        comment: {
            type: String,
        },
        author: {
            type: String,
        },
        link: {
            type: String,
        },
        icon:{
            type:String
        }
    }, {timestamps: true}
);

schema.plugin(paginate)
schema.plugin(aggregatePaginate)
const Comment = model('comment', schema);

module.exports = Comment;

