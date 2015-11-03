module.exports = function (app) {
    var io = app.get('io');

    io.on('connection', function (socket) {
        
        socket._currentState = 'connected';
        
        socket.on('read-string-memory', function (c_string) {
            if (c_string == null) {
                // No session at all
                socket.emit('set-state', 'welcome'); 
            } else {
                // TODO: Handle Session
                // Also return 'login' when invalid session, cause they've logged in before...
            }
        });
        
        socket.emit('read-string-memory', 'session');       
    });
}
