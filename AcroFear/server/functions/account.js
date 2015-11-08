// Account Handling!
var crypto = require('crypto');

// Data Models
var User = require('../models/user.js');
var Session = require('../models/session.js');

var account = {};

account.socket = null;

account.SetSocket = function (c_socket) {
    account.socket = c_socket;
}

account.VerifyEmailAddress = function (email) {
    var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    
    return re.test(email);
}

account.SanitizeUserDocument = function (userDocument) {
    var sanitizedUserDocument = JSON.parse(JSON.stringify(userDocument));
    sanitizedUserDocument.salt = undefined;
    sanitizedUserDocument.password = undefined;
    
    return sanitizedUserDocument;
}

account.CreateUser = function(email, username, password) {
    if (email == undefined || password == undefined) {
        account.socket.emit('registrationResult', { success: false, msg: 'Need more data...' });
        return;
    }
    
    if (!account.VerifyEmailAddress(email)) {
        account.socket.emit('registrationResult', { success: false, msg: 'Invalid email address...' });
        return;
    }
    
    User.findOne({ 'email': email }, function (err, existingUser) {
        
        if (existingUser !== null) {
            account.socket.emit('registrationResult', { success: false, msg: 'User already exists' });
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
                account.socket.emit('registrationResult', { success: false, msg: 'Unknown Error', err: err });
                return;
            }
            
            account.socket.emit('registrationResult', { success: true, userid: user._id });
            return;
        });
    });
}

account.Login = function (email, password) {
    if (email === undefined || password === undefined) {
        account.socket.emit('loginResult', { success: false, msg: 'Need more data...' });
        return;
    }
    
    if (!account.VerifyEmailAddress(email)) {
        account.socket.emit('loginResult', { success: false, msg: 'Need a valid email...' });
        return;
    }
    
    User.findOne({ 'email': email }).exec(function (err, existingUser) {
        
        if (existingUser === null) {
            account.socket.emit('loginResult', { success: false, msg: 'I don\'t think I know you, try registering?' });
            return;
        }
        
        var salty_password = require('../../ss.json').ss + password + existingUser.salt;
        
        var key = crypto.pbkdf2Sync(salty_password, existingUser.salt, 10000, 512);
        
        var derivedKey = key.toString('hex');
        
        if (existingUser.password !== derivedKey) {
            account.socket.emit('loginResult', { success: false, msg: 'Access Denied...' });
            return;
        }
        
        // Find Old Session
        var a_clientIp = account.socket.client.conn.remoteAddress;
        
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
                        account.socket.emit('loginResult', { success: false, msg: 'Could not save your session...' });
                        return;
                    }
                    
                    existingUser._sessions.push(existingSession._id);
                    existingUser.save();
                    
                    account.ProcessLogin(existingSession.token, existingUser);
                });
            } else {
                account.ProcessLogin(existingSession.token, existingUser);
            }
        });
    });
};

account.ProcessLogin = function (token, user) {
    var a_cleanUser = account.SanitizeUserDocument(user);
    
    account.socket._user = a_cleanUser;
    account.socket._isAuthed = true;
    account.socket.emit('write-string-memory', { key: 'session', value: token });
    account.socket.emit('set-user', { user: a_cleanUser });
    account.socket.emit('loginResult', { success: true });
    account.socket.emit('set-state', 'lobby');
};

account.ConsumeToken = function (token, callback) {
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
            
            callback(null, { 'token': newToken, 'user': account.SanitizeUserDocument(existingSession._user) });
        });
    });
}

module.exports = account;