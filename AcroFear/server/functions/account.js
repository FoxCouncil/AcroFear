// Account Handling!
var crypto = require('crypto');

// Data Models
var User = require('../models/user.js');
var Session = require('../models/session.js');

function Account(c_socket, c_io) {
    this.m_io = c_io;
    this.m_socket = c_socket;
}

Account.prototype.VerifyEmailAddress = function (email) {
    var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    
    return re.test(email);
}

Account.prototype.SanitizeUserDocument = function (userDocument) {
    var sanitizedUserDocument = JSON.parse(JSON.stringify(userDocument));
    sanitizedUserDocument.salt = undefined;
    sanitizedUserDocument.password = undefined;
    
    return sanitizedUserDocument;
}

Account.prototype.CreateUser = function (email, username, password) {
    
    var a_accountObj = this;
    var a_socket = this.m_socket;

    if (email == undefined || password == undefined) {
        a_socket.emit('registrationResult', { success: false, msg: 'Need more data...' });
        return;
    }
    
    if (!this.VerifyEmailAddress(email)) {
        a_socket.emit('registrationResult', { success: false, msg: 'Invalid email address...' });
        return;
    }
    
    User.findOne({ 'email': email }, function (err, existingUser) {
        
        if (existingUser !== null) {
            a_socket.emit('registrationResult', { success: false, msg: 'User already exists' });
            return;
        }
        
        var userSalt = crypto.randomBytes(128).toString('base64');
        
        var salty_password = require('../../ss.json').ss + password + userSalt;
        
        var key = crypto.pbkdf2Sync(salty_password, userSalt, 10000, 512);
        
        var derivedKey = key.toString('hex');
        
        var user = new User({
            email: email,
            username: username,
            salt: userSalt,
            password: derivedKey
        });
        
        // save the user and check for errors
        user.save(function (err) {
            
            if (err) {
                a_socket.emit('registrationResult', { success: false, msg: 'Unknown Error', err: err });
                return;
            }
            
            a_socket.emit('registrationResult', { success: true, userid: user._id, email: email });

            return;
        });
    });
}

Account.prototype.Login = function (email, password) {
    
    var a_accountObj = this;
    var a_socket = this.m_socket;

    if (email === undefined || password === undefined) {
        a_socket.emit('loginResult', { success: false, msg: 'Need more data...' });
        return;
    }
    
    if (!this.VerifyEmailAddress(email)) {
        a_socket.emit('loginResult', { success: false, msg: 'Need a valid email...' });
        return;
    }
    
    User.findOne({ 'email': email }).exec(function (err, existingUser) {
        
        if (existingUser === null) {
            a_socket.emit('loginResult', { success: false, msg: 'I don\'t think I know you, try registering?' });
            return;
        }
        
        var salty_password = require('../../ss.json').ss + password + existingUser.salt;
        
        var key = crypto.pbkdf2Sync(salty_password, existingUser.salt, 10000, 512);
        
        var derivedKey = key.toString('hex');
        
        if (existingUser.password !== derivedKey) {
            a_socket.emit('loginResult', { success: false, msg: 'Access Denied...' });
            return;
        }
        
        // Find Old Session
        var a_clientIp = a_socket.client.conn.remoteAddress;
        
        Session.findOne({ 'ip': a_clientIp }, function (err, existingSession) {
            
            if (existingSession === null) {
                
                // Create New Session
                existingSession = new Session({
                    ip: a_clientIp,
                    token: crypto.randomBytes(128).toString('base64'),
                    _user: existingUser._id
                });
                
                existingSession.save(function (err) {
                    
                    if (err) {
                        a_socket.emit('loginResult', { success: false, msg: 'Could not save your session...' });
                        return;
                    }
                    
                    existingUser._sessions.push(existingSession._id);
                    existingUser.save();
                    
                    a_accountObj.ProcessLogin(existingSession.token, existingUser);
                });
            } else {
                a_accountObj.ProcessLogin(existingSession.token, existingUser);
            }
        });
    });
};

Account.prototype.ProcessLogin = function (token, user) {
    var a_cleanUser = this.SanitizeUserDocument(user);
    
    this.m_socket._user = a_cleanUser;
    this.m_socket._isAuthed = true;
    this.m_socket.emit('write-string-memory', { key: 'session', value: token });
    this.m_socket.emit('set-user', a_cleanUser);
    this.m_socket.emit('loginResult', { success: true });
    this.m_socket.emit('set-state', 'lobby');
};

Account.prototype.ConsumeToken = function (token, callback) {
    var a_accountObj = this;
    process.nextTick(function () {        
        Session.findOne({ 'token': token }).populate('_user').exec(function (err, existingSession) {
            
            if (callback === undefined) {
                return;
            }
            
            if (err !== null) {
                callback(err);
                return;
            }
            
            if (existingSession === null) {
                callback('session not found');
                return;
            }
            
            var newToken = crypto.randomBytes(128).toString('base64');
            
            existingSession.token = newToken;
            existingSession.save(function (err) {
                
                if (err) {
                    callback(err);
                    return;
                }
                
                callback(null, { 'token': newToken, 'user': a_accountObj.SanitizeUserDocument(existingSession._user) });
            });
        });
    });
}

module.exports = Account;