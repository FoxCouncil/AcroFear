
function Messaging(c_socket, c_io) {
    this.m_io = c_io;
    this.m_socket = c_socket;
    this.m_currentChannel = ''; // TODO: Make cachable in user object!
}

Messaging.prototype.JoinChannel = function (c_channelName) {
    
    var a_io = this.m_io;
    var a_socket = this.m_socket;

    a_socket.join(c_channelName);
    this.m_currentChannel = c_channelName;
    a_socket.to(c_channelName).emit('chat', { type: 'msg-join', value: a_socket._user.username + ' has joined the channel.' });

    this.ChannelData();
};

Messaging.prototype.ChannelData = function () {
    
    var a_io = this.m_io;
    var a_socket = this.m_socket;
    
    if (a_socket.adapter.rooms[this.m_currentChannel] == null) {
        return; // There was no-one left in the channel, sad
    }

    var a_userList = Object.keys(a_socket.adapter.rooms[this.m_currentChannel]).map(function (a_roomSocketId) {
        return a_io.sockets.connected[a_roomSocketId]._user.username;
    });
    
    var a_channelDataObj = {
        name: this.m_currentChannel,
        total: a_userList.length,
        users: a_userList,
        topic: ''
    };
    
    a_socket.to(this.m_currentChannel).emit('room-data', a_channelDataObj);
    a_socket.emit('room-data', a_channelDataObj);
};

Messaging.prototype.Disconnection = function () {
    if (this.m_socket._isAuthed) {
        this.m_socket.to(this.m_currentChannel).emit('chat', { type: 'msg-leave', value: this.m_socket._user.username + ' has left the channel.' });
        this.ChannelData();
    }
};

Messaging.prototype.SendChat = function(c_userChat) {
    
    if (c_userChat) {

        console.log(this.m_socket.id);

        this.m_socket.to(this.m_currentChannel).emit('chat', {
            who: this.m_socket._user.username,
            type: 'msg-normal',
            value: c_userChat
        });
    }
}

module.exports = Messaging;