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
        socket.on('login', function (loginDetails) {
            accounts.Login(loginDetails.email, loginDetails.password);
        });

        socket.on('register', function(regDetails) {
            accounts.CreateUser(regDetails.email, regDetails.username, regDetails.password);
        });
        
        // Chat Handler
        socket.on('chat', function (userChat) {
            messaging.SendChat(userChat);
        });
        
        // Command Handler
        socket.on('command', function (command) {
            messaging.Command(command.msg, command.args);
        });
        
        // Memory Handler
        socket.on('read-string-memory', function(memory) {
            switch (memory.key) {
                case 'session': {
                    if (memory.value == null) {
                        // No session at all
                        socket.emit('set-state', 'welcome');
                    } else {
                        accounts.ConsumeToken(memory.value, function(authResult, authData) {
                            if (authResult === null) {
                                accounts.ProcessLogin(authData.token, authData.user);
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
