let Player = require(process.cwd()+'/api/hooks/game/lib/Player.js');

module.exports = {
  playerConnected: function(req, res) {
    console.log('playerConnected');
    let data = req.allParams();

    let socket = req.socket;
    console.log('we ready:',socket.id);

    sails.sockets.join(req, [socket.id, 'game'], (err) => {
      if (err) {
        console.log('Error registering user websocket connection:', err);
        throw (err);
      }

      console.log('We in:',socket.id);

      sails.sockets.blast('connected', { id: socket.id });


      sails.hooks.game.gameObject.players.push(new Player({ id: socket.id }));

      // Check every map in our /lib/maps.js file to see if it's the one
      // our game is currently using.
      for (var map in sails.hooks.game.gameObject.maps) {
        if (sails.hooks.game.gameObject.maps.hasOwnProperty(map)) {
          sails.hooks.game.gameObject.maps[map].bindUpdateEvent(sails.sockets.broadcast);
        }
      }

    });

    return res.ok({
      we: 'ready'
    });
  },
  startGame: function(req, res) {
    console.log('startGame');
    let data = req.allParams();

    console.log('WE ARE STARTING THE GAME', data);  
    if (!sails.hooks.game.gameObject.maps[data.mapId]) {
      util.log('Map not found: ' + data.mapId);
      return;
    }

    var countdown = 4;
    var mapId = data.mapId;

    if (sails.hooks.game.gameObject.maps[mapId].isStarting || sails.hooks.game.gameObject.maps[mapId].started) {
      return;
    }

    if (!sails.hooks.game.gameObject.maps[mapId].isStarting) {
      sails.hooks.game.gameObject.maps[mapId].isStarting = true;
    }

    var startCountdown = setInterval(function() {
    var text;
    switch (countdown) {
    case 4:
      text = 'Game is startinsails.hooks.game.gameObject...';
    break;
    case 3:
      text = '3';
    break;
    case 2:
      text = '2';
    break;
    case 1:
      text = '1';
    break;
    case 0:
      text = 'Start!';
    break;
    }

    if (text) {
      sails.sockets.broadcast(mapId, 'startGameCountdown', text);
      if (text === 'Start!') {
        sails.hooks.game.gameObject.maps[mapId].start();
        clearInterval(startCountdown);
      }
    }

    countdown--;

    }, 1000);
  },
  resetGame: function(req, res) {
    console.log('resetGame');

    let data = req.allParams();

    if (!sails.hooks.game.gameObject.maps[data.mapId]) {
      util.log('Map not found: ' + data.mapId);
      return;
    }

    sails.hooks.game.gameObject.maps[data.mapId].reset();
    sails.sockets.broadcast(mapId, data.mapId, 'resetGame');

  },
  updatePlayer: function(req, res) {

    let data = req.allParams();
    console.log('updatePlayer', data);

    var player = sails.hooks.game.playerById(req.socket.id);
    if (!player) {
      util.log('Player not found: ' + req.socket.id);
      return;
    }

    player.updateKeys(data);
  },
  setPlayerName: function(req, res) {
    console.log('setPlayerName');

    let data = req.allParams();

    console.log('SETTING PLAYER NAME!');
    sails.hooks.game.playerById(req.socket.id).name = data.name;
  },
  getMap: function(req, res) {
    console.log('getMap');

    let data = req.allParams();

    if (!sails.hooks.game.gameObject.maps[data.mapId]) {
      util.log('Map not found: ' + data.mapId);
      return;
    }

    sails.sockets.blast('getMap', sails.hooks.game.gameObject.maps[data.mapId].serialize());

  },
  newPlayer: function(req, res) {
    console.log('newPlayer');

    let data = req.allParams();

    if (!sails.hooks.game.gameObject.maps[data.mapId]) {
      util.log('Map not found: ' + data.mapId);
      return;
    }

    var player = sails.hooks.game.playerById(req.socket.id);
    if (!player) {
      util.log('Player not found: ' + req.socket.id);
      return;
    }

    sails.sockets.broadcast(data.mapId, 'newPlayer', player.serialize());

    // Send existing players to the new player
    for (var i = 0, p = sails.hooks.game.gameObject.maps[data.mapId].players; i < p.length; i++) {
      sails.sockets.blast('newPlayer', p[i].serialize());
    }

    sails.sockets.join(req, data.mapId);
    player.joinMap(sails.hooks.game.gameObject.maps[data.mapId]);
  }
}