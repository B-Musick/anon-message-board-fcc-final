let mongoose = require('mongoose');

let boardSchema = new mongoose.Schema({
    name: String,
    threads:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Thread' 
        }
    ]
})

module.exports = mongoose.model('Board',boardSchema);