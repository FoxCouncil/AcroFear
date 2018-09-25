var ChatMessage = require('../models/chat_message.js');

function Messaging(c_socket, c_io) {
    this.m_io = c_io;
    this.m_socket = c_socket;
    this.m_currentChannel = ''; // TODO: Make cachable in user object!
}

Messaging.prototype.JoinChannel = function (c_channelName) {
    
    var a_io = this.m_io;
    var a_socket = this.m_socket;
    
    if (this.m_currentChannel != '') {
        a_socket.to(this.m_currentChannel).emit('chat', { type: 'msg-leave', value: a_socket._user.username + ' has left the channel.' });
        a_socket.leave(this.m_currentChannel);
        this.ChannelData();
    }

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
    var a_chatMessage = ChatMessage({
        _user: this.m_socket._user._id,
        msg: c_userChat,
        room: this.m_currentChannel
    });
        
    a_chatMessage.save();
       
    this.m_socket.to(this.m_currentChannel).emit('chat', {
        who: this.m_socket._user.username,
        type: 'msg-normal',
        timestamp: a_chatMessage.created,
        value: c_userChat
    });
}

Messaging.prototype.Command = function(c_controlMsg, c_controlArgs) {
    switch (c_controlMsg) {
        case 'help': {
            this.m_socket.emit('chat', {
                who: "System",
                type: "msg-help",
                timestamp: Date.now(),
                value: "There is no help for you..."
            });
        } break;
        case 'join': {
            this.JoinChannel(c_controlArgs.split(' ')[0]);
        } break;
        default: {
            this.m_socket.emit('chat', {
                who: "System",
                type: "msg-error",
                timestamp: Date.now(),
                value: "Command " + c_controlMsg + " not recognized. Please do not try again..."
            });
        }
    }
}

module.exports = Messaging;