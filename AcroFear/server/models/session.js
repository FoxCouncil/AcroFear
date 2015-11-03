// Session Datamodel
var crypto	 = require('crypto');
var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var SessionSchema = new Schema({
	_user: { type: Schema.Types.ObjectId, ref: 'User' },
	ip: String,
	token: String,
	updated: { type: Date },
	created: { type: Date, default: Date.now }
});

SessionSchema.pre('save', function(next) {
	this.updated = new Date();
	next();
});

module.exports = mongoose.model('Session', SessionSchema);