
/**
 * Module dependencies.
 */

var express = require('express')
  , routes  = require('./routes')
  , http    = require('http')
  , path    = require('path')
  , moment  = require('moment');
  
var app     = express();

var server  = http.createServer(app);
var io      = require('socket.io').listen(server);
server.listen(8000);

var Chat    = require('./chat');

Chat.initialize({
    io: io
});

app.configure(function() {
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function() {
  app.use(express.errorHandler());
});

app.get('/', routes.index);

var fs = require('fs');
app.get('/socket.io/socket.io.js', function(req, res) {
    fs.readFile('./node_modules/socket.io/lib/socket.io.js', function(error, content) {
        if (error) {
            res.writeHead(500);
            res.end();
        } else {
            res.writeHead(200, { 'Content-Type': 'text/javascript' });
            res.end(content, 'utf-8');
        }
    });
});

io.sockets.on('connection', function (socket) {
    var usernames = Chat.getUserList();
    
    // User sends message
    socket.on('sendchat', function (message) {
        Chat.handleIncomingMessage(io, message, socket.username);
    });
    
    // New user
    socket.on('adduser', function (username) {
        socket.username = username;
        Chat.addUser(username);
        
        socket.emit('updatechat', {
            from: 'SYSTEM', 
            message: 'You have connected as "<strong>' + username + '</strong>"',
            isSystemMessage: true
        });
        
        socket.broadcast.emit('updatechat', {
            from: 'SYSTEM',
            message: username + ' has entered the building',
            isSystemMessage: true
        });
        
        io.sockets.emit('updateusers', usernames);
    });
    
    // Disconnect
    socket.on('disconnect', function () {
        //usernames = getUserList(usernames, socket.username);
        usernames = Chat.rebuildUserList(socket.username);
        
        io.sockets.emit('updateusers', usernames);
        
        socket.broadcast.emit('updatechat', {
            from: 'SYSTEM',
            message: socket.username + ' has left the building',
            isSystemMessage: true
        });
    });
});

http.createServer(app).listen(app.get('port'), function() {
    console.log("Express server listening on port " + app.get('port'));
});
