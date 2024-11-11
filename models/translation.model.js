const {model, Schema} = require('mongoose')
let schema = new Schema({
        name: String,
        code: {
            type: String,
            required: true,
            lowercase: true,
            unique: true
        },
        flag: String,
        rtl: {
            type: Boolean,
            default: false
        },
        active: {
            type: Boolean,
            default: true
        },
        default: {
            type: Boolean,
            default: false
        },
        translation: [{
            key: String,
            value: String
        }]
    }, {timestamps: true}
)

const Language = model('language', schema);
module.exports = Language;