// User Datamodel
var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var GameSchema = new Schema({
    _players: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    _room: { type: Schema.Types.ObjectId, ref: 'GameRoom' },
    _winner: { type: Schema.Types.ObjectId, ref: 'User' },
    complete: Boolean,
    score: Number,
	updated: { type: Date },
	created: { type: Date, default: Date.now }
});

GameSchema.pre('save', function(next) {
	this.updated = new Date();
	next();
});

module.exports = mongoose.model('Game', GameSchema);
