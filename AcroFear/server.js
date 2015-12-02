var mongoose = require('mongoose');
var express = require('express');
var crypto = require('crypto');
var path = require('path');
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
app.set('port', process.env.port || 1337);
app.set('views', path.join(__dirname, 'client/static/html'));
app.set('view engine', 'jade');

// DB
app.set('mongoose', mongoose.connect('mongodb://192.168.99.100:32770/acrofear'));

// Middleware
app.use(require('stylus').middleware(path.join(__dirname, 'client')));
app.use(express.static('client'));

// web server
require('./server/routes.js')(app);

var server = app.listen(app.get('port'), function () {
    var host = server.address().address;
    var port = server.address().port;
    
    console.log('AcroFear server listening at http://%s:%s', host, port);
});

app.set('io', io.listen(server));

require('./server/networking.js')(app);