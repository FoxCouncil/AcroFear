var Game = require('./models/game.js');
var GameRoom = require('./models/game_room.js');

function Conductor(app) {
    this.app = app;
    this.activeGames = [];
}

Conductor.prototype.StartGame = function (gameRoom, players) {
    
    // TODO: Players may be socket.io objects instead of 'UserSchema' Objects
    // TODO: This is very immature and needs to be flushed out
    var aNewGame = new Game({
        _players: players,
        _room: gameRoom
    });

    this.activeGames.push(aNewGame);
};

Conductor.prototype.Tick = function (delta) {
    for (var activeGameIndex in this.activeGames) {
        activeGame = this.activeGames[activeGameIndex];
        
        activeGame.Tick();
        
        console.log(activeGame);

        if (activeGame.completed) {
            // TODO: Fire and forget global winner notification
            this.activeGames.splice(activeGameIndex, 1);
        }
    }

    process.nextTick();
};

module.exports = Conductor;