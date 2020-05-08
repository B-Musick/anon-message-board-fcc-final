let mongoose = require('mongoose');

let replySchema = new mongoose.Schema({
    thread: {type: String, default:''}, // Thread the reply is associated
    text: {type:String, default:''},
    created_on: {type:Date, default: Date.now()},
    delete_password: { type:String, default: ''},
    reported: {type:Boolean, default: false}
});

module.exports = mongoose.model('Reply',replySchema);