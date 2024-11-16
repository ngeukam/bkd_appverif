const {model, Schema} = require('mongoose')
const paginate = require('mongoose-paginate-v2')
const aggregatePaginate = require('mongoose-aggregate-paginate-v2')

const schema = new Schema({
    label: {
        type: String,
        required: true,
      },
    value: {
        type: String,
        required: true,
        unique: true,
      },
    active: {
        type: Boolean,
        default: true,
      },
      quote:{
        type:Number,
      }
    }, { timestamps: true });

schema.plugin(paginate)
schema.plugin(aggregatePaginate)
const AppSize = model('appsize', schema);
module.exports = AppSize;

