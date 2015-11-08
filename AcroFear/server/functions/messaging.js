var messaging = {};

messaging.socket = null;
messaging.currentChannel = '';   // TODO: Make cachable in user object!

messaging.SetSocket = function (c_socket) {
    messaging.socket = c_socket;
};

messaging.JoinChannel = function (c_channelName) {
    messaging.socket.join(c_channelName);
    messaging.currentChannel = c_channelName;
    messaging.socket.to(c_channelName).emit('chat', { type: 'msg-join', value: messaging.socket._user.username + ' has joined the channel.' });
};

messaging.Disconnection = function () {
    if (messaging.socket._isAuthed) {
        messaging.socket.to(messaging.currentChannel).emit('chat', { type: 'msg-leave', value: messaging.socket._user.username + ' has left the channel.' });
    }
};

module.exports = messaging;