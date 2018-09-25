var mongoose = require('mongoose');
var express = require('express');
var crypto = require('crypto');
var path = require('path');
var util = require('util');
var app = express();
var fs = require('fs');
var io = require('socket.io');

// Create A System Salt
fs.open('./ss.json', 'wx', function (err, fd) {
    if (err === null) {
        var ss = { ss: crypto.randomBytes(128).toString('base64') };
        fs.write(fd, JSON.stringify(ss));
    }
});

// Server Variables
var server_settings = JSON.parse(fs.readFileSync('server_settings.json', 'utf8'));
app.set('server settings', server_settings);
app.set('port', process.env.port || server_settings.port);
app.set('views', path.join(__dirname, 'client/static/html'));
app.set('view engine', 'jade');

// DB
var db_settings = server_settings.db;
var dbString = util.format('mongodb://%s:%d/%s', db_settings.host, db_settings.port, db_settings.name);
console.log(dbString);
app.set('mongoose', mongoose.connect(dbString));

// Middleware
app.use(require('stylus').middleware(path.join(__dirname, 'client')));
app.use(express.static('client'));

// web server
require('./server/routes.js')(app);

var server = app.listen(app.get('port'), function () {
    var host = server.address().address;
    var port = server.address().port;
    
    console.log('AcroFear server listening at %s:%s', host, port);
});

app.set('io', io.listen(server));

// Server Modules
require('./server/conductor.js')(app);
require('./server/networking.js')(app);