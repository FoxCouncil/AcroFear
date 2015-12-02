module.exports = function (app) {
    
    var io = app.get('io');

    var AccountObject = require('./functions/account.js');
    var MessagingObject = require('./functions/messaging.js');

    io.on('connection', function(socket) {

        var accounts = new AccountObject(socket, io);
        var messaging = new MessagingObject(socket, io);

        socket._currentState = 'connected';
        socket._isAuthed = false;
        
        // State Stuff
        socket.on('disconnect', function() {
            messaging.Disconnection();
        });
        
        // User Stuff
        socket.on('login', function (c_loginDetails) {
            accounts.Login(c_loginDetails.email, c_loginDetails.password);
        });

        socket.on('register', function(c_regDetails) {
            accounts.CreateUser(c_regDetails.email, c_regDetails.username, c_regDetails.password);
        });
        
        // Chat Handler
        socket.on('chat', function (c_userChat) {
            messaging.SendChat(c_userChat);
        })
        
        // Channel Handler
        socket.on('join-channel', function (c_channelName) {
            messaging.JoinChannel(c_channelName);
        });
        
        // Memory Handler
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
