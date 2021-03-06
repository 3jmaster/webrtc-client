var express = require('express'),
    expressApp = express();

expressApp.use(express.static(__dirname + '/public/'));

    socketio = require('socket.io'),

    http = require('http'),
    server = http.createServer(expressApp),
    uuid = require('node-uuid'),
    commonRoom = {},
    userIds = {};


exports.run = function (config) {


  server.listen(config.PORT);
  console.log('Listening on', config.PORT);
  socketio.listen(server, { log: false, pingInterval: 10000, pingTimeout: 5000 })
  .on('connection', function (socket) {
    console.log('Socket connect ', socket.id);

    var id;

    socket.on('init', function (data, fn) {
      fn('commonRoom', socket.id);
      for (var key in commonRoom) {
          commonRoom[key].emit('peer.connected', { id: socket.id });
      }
      commonRoom[socket.id] = socket;
      console.log('Peer connected to common room: ', socket.id);
      console.log('CommonRoom: ', Object.keys(commonRoom));
    });

    socket.on('re-init', function (data, fn) {
      delete commonRoom[data.oldId];
      for (var key in commonRoom) {
          commonRoom[key].emit('peer.disconnected', { id: data.oldId });
      }
      fn('commonRoom', socket.id);
      for (var key in commonRoom) {
          commonRoom[key].emit('peer.connected', { id: socket.id });
      }
      commonRoom[socket.id] = socket;
      console.log('Peer re-connected to common room: ', socket.id);
      console.log('CommonRoom: ', Object.keys(commonRoom));
    });

    socket.on('msg', function (data) {
      var toSocket = commonRoom[data.to];
      if (toSocket) {
        console.log('Redirecting message to', data.to, 'by', data.by, ' -- data type: ', data.type);
        toSocket.emit('msg', data);
      } else {
        console.warn('Invalid user');
      }
    });

    socket.on('disconnect', function () {
      delete commonRoom[socket.id];
      for (var key in commonRoom) {
          commonRoom[key].emit('peer.disconnected', { id: socket.id });
      }
      console.log('Peer disconnected to common room: ', socket.id);
      console.log('CommonRoom: ', Object.keys(commonRoom));
    });
  });
};
