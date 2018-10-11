var util = require('util');
let Map = require(process.cwd()+'/api/hooks/game/lib/Map.js');
let mapData = require(process.cwd()+'/api/hooks/game/maps.js');


module.exports = function GameHook(sails) {

  let gameData = {

    /**
     * Runs when a Sails app loads/lifts.
     *
     * @param {Function} done
     */
    initialize: async function (done) {

      sails.after(['hook:orm:loaded', 'hook:sockets:loaded'], async ()=> {

        // Instantiate a new game and make it available globally
        // on the game hook;
        sails.hooks.game.gameObject = {
          io: undefined,
          players: [],
          maps: {},
          time: {
            step: 1 / 60,
            now: 0
          }
        };

        for (var mapId in mapData) {
          if (mapData.hasOwnProperty(mapId)) {
            // Make a new map
            sails.hooks.game.gameObject.maps[mapId] = new Map({
              mapId: mapId,
              map: mapData[mapId]
            });
          }
        }

        sails.hooks.game.stepIntervalId = setInterval(sails.hooks.game.step, 1000 * sails.hooks.game.gameObject.time.step);

        console.log('Game hook loaded');

        // Send the signal that the game hook has been loaded;
        sails.emit('hook:game:ready');
      });

      return done();
    },
    gameRestartInterval: undefined,
    gameObject: undefined,
    stepIntervalId: undefined,
    sendDisconnectNotice: function(socketObject) {

      console.log('User',socketObject.id,'has disconnected');
      let player = sails.hooks.game.playerById(socketObject.id);
      if (!player) {
        util.log("Player not found: " + socketObject.id);
        return;
      }

      sails.hooks.game.gameObject.players.splice(sails.hooks.game.gameObject.players.indexOf(player), 1);
      sails.sockets.broadcast(player.mapId, 'removePlayer', { id: socketObject.id });

      if (!sails.hooks.game.gameObject.maps[player.mapId]) {
        util.log("Map not found: " + player.mapId);
        return;
      }

      player.leaveMap(sails.hooks.game.gameObject.maps[player.mapId]);

      return;
    },
    step: function() {
      var now = Date.now();
      if (!sails.hooks.game.gameObject.time.now) {
        sails.hooks.game.gameObject.time.now = now;
      }
      var elapsed = now - sails.hooks.game.gameObject.time.now;
      sails.hooks.game.gameObject.maps['lobby'].update(elapsed / 1000);
      sails.hooks.game.gameObject.time.now = now;
    },
    playerById: function(id) {
      for (var i = 0; i < sails.hooks.game.gameObject.players.length; i++) {
        if (sails.hooks.game.gameObject.players[i].id === id) {
          return sails.hooks.game.gameObject.players[i];
        }
      }
      return false;
    }

  };

  return gameData;

};
