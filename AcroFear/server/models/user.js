// User Datamodel
var crypto	 = require('crypto');
var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var UserSchema = new Schema({
	email: String,
	password: String,
	salt: String,
	username: String,
	firstname: String,
	lastname: String,
	_sessions: [{ type: Schema.Types.ObjectId, ref: 'Session' }],
	updated: { type: Date },
	created: { type: Date, default: Date.now }
});

UserSchema.pre('save', function(next) {
	this.updated = new Date();
	next();
});

module.exports = mongoose.model('User', UserSchema);
