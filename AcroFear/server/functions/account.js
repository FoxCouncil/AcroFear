// Account Handling!
var crypto = require('crypto');

// Data Models
var User = require('../models/user.js');
var Session = require('../models/session.js');

var account = {};

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

account.CreateUser = function (req, res) {
    if (req.body.email == undefined || req.body.password == undefined) {
        res.json({ success: false });
        return;
    }
    
    if (!account.VerifyEmailAddress(req.body.email)) {
        res.json({ success: false });
        return;
    }
    
    User.findOne({ 'email': req.body.email }, function (err, existingUser) {
        
        if (existingUser !== null) {
            res.json({ success: false, msg: 'User already exists' });
            return;
        }
        
        var userSalt = crypto.randomBytes(128).toString('base64');
        
        var salty_password = require('../ss.json').ss + req.body.password + userSalt;
        
        var key = crypto.pbkdf2Sync(salty_password, userSalt, 10000, 512);
        
        var derivedKey = key.toString('hex');
        
        var user = new User({
            email: req.body.email,
            salt: userSalt,
            password: derivedKey
        });
        
        // save the user and check for errors
        user.save(function (err) {
            
            if (err) {
                res.send(err);
                return;
            }
            
            res.json({ success: true, userid: user._id });
        });
    });
}

account.Login = function (req, res) {
    if (req.body.email === undefined || req.body.password === undefined) {
        res.json({ success: false });
        return;
    }
    
    if (!account.VerifyEmailAddress(req.body.email)) {
        res.json({ success: false });
        return;
    }
    
    User.findOne({ 'email': req.body.email }).exec(function (err, existingUser) {
        
        if (existingUser === null) {
            res.json({ success: false });
            return;
        }
        
        var salty_password = require('../ss.json').ss + req.body.password + existingUser.salt;
        
        var key = crypto.pbkdf2Sync(salty_password, existingUser.salt, 10000, 512);
        
        var derivedKey = key.toString('hex');
        
        if (existingUser.password !== derivedKey) {
            res.json({ success: false });
            return;
        }
        
        // Find Old Session
        Session.findOne({ 'ip': req.ip }, function (err, existingSession) {
            
            if (existingSession === null) {
                // Create New Session
                existingSession = new Session({
                    ip: req.ip,
                    token: crypto.randomBytes(128).toString('base64'),
                    _user: existingUser._id
                });
                
                existingSession.save(function (err) {
                    
                    if (err) {
                        res.send(err);
                        return;
                    }
                    
                    existingUser._sessions.push(existingSession._id);
                    existingUser.save();
                    
                    res.json({ success: true, token: existingSession.token, user: account.SanitizeUserDocument(existingUser) });
                });
            }
            else {
                res.json({ success: true, token: existingSession.token, user: account.SanitizeUserDocument(existingUser) });
            }
        });
    });
}

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
            
            callback(null, { 'token': newToken, 'user': existingSession._user });
        });
    });
}

module.exports = account;