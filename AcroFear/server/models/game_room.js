var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var GameRoomSchema = new Schema({
    name: String,
    topic: String,
    description: String,
    is_public: Boolean,
	updated: { type: Date },
	created: { type: Date, default: Date.now }
});

GameRoomSchema.pre('save', function(next) {
	this.updated = new Date();
	next();
});

module.exports = mongoose.model('GameRoom', GameRoomSchema);
