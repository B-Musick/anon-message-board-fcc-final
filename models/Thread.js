let mongoose = require('mongoose');

let threadSchema = new mongoose.Schema({
    board: { type: String, default: '' },
    text: {type:String, default: ''}, 
    created_on: {type: Date, default: Date.now()}, 
    bumped_on: { type: Date, default: Date.now() },
    reported: { type:Boolean, default: false}, 
    delete_password: { type: String, default: '' }, 
    replies: [
        { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Reply' 
        }
    ]
})

module.exports = mongoose.model('Thread',threadSchema);