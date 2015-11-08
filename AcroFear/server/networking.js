module.exports = function (app) {

    
    var io = app.get('io');

    io.on('connection', function(socket) {
        
        var accounts = require('./functions/account.js');
        var messaging = require('./functions/messaging.js');

        accounts.SetSocket(socket);
        messaging.SetSocket(socket);

        socket._currentState = 'connected';
        socket._isAuthed = false;
        
        // State Stuff
        socket.on('disconnect', function() {
            messaging.Disconnection();

            delete accounts;
            delete messaging;
        });
        
        // User Stuff
        socket.on('login', function (c_loginDetails) {
            accounts.Login(c_loginDetails.email, c_loginDetails.password);
        });

        socket.on('register', function(c_regDetails) {
            accounts.CreateUser(c_regDetails.email, c_regDetails.username, c_regDetails.password);
        });
        
        socket.on('join-channel', function (c_channelName) {
            messaging.JoinChannel(c_channelName);
        });
        
        socket.on('read-string-memory', function(c_memory) {
            switch (c_memory.key) {
                case 'session': {
                    if (c_memory.value == null) {
                        // No session at all
                        socket.emit('set-state', 'welcome');
                    } else {
                        accounts.ConsumeToken(c_memory.value, function(c_authResult, c_authData) {
                            if (c_authResult === null) {
                                accounts.ProcessLogin(c_authData.token, c_authData.user);
                            } else {
                                socket.emit('set-state', 'welcome');
                            }
                        });                        
                    }
                }
                break;
            }
        });
        
        socket.emit('read-string-memory', 'session');       
    });
}
