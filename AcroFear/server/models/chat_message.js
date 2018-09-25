// User Datamodel
var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var ChatMessageSchema = new Schema({
    _user: { type: Schema.Types.ObjectId, ref: 'User' },
    msg: String,
    room: String,
	updated: { type: Date },
	created: { type: Date, default: Date.now }
});

ChatMessageSchema.pre('save', function(next) {
	this.updated = new Date();
	next();
});

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
