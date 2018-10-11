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

        let searchForDead = async function(){
          for (let onePlayer of sails.hooks.game.gameObject.players) {
            if (!onePlayer.alive && !onePlayer.isDying) {
              console.log('A player has died');
              onePlayer['isDying'] = true;
              sails.sockets.blast('death', onePlayer.serialize());

              let killer;
              try {
                killer = await User.findOne({
                  socketId: onePlayer.whoKilledMe.id
                });
              }
              catch(nope) {
                console.log(nope);
                return;
              }
console.log('got killer:',killer);
              try {
                killer = await User.update({
                  socketId: onePlayer.whoKilledMe.id
                }, {
                  kills: killer.kills+1
                }).fetch();
                killer = killer[0];
              }
              catch(nope) {
                console.log(nope);
                return;
              }
console.log('updated killer:',killer);

console.log('want corpse:',onePlayer.id);

              let corpse;
              try {
                corpse = await User.findOne({
                  socketId: onePlayer.id
                });
              }
              catch(nope) {
                console.log(nope);
                return;
              }
console.log('got corpse:',corpse);

              try {
                corpse = await User.update({
                  socketId: onePlayer.id
                }, {
                  deaths: corpse.deaths+1
                }).fetch();
                corpse = corpse[0];
              }
              catch(nope) {
                console.log(nope);
                return;
              }

              console.log('attempting respawn of',corpse.socketId);

              sails.hooks.game.gameObject.maps.lobby.respawn(sails.hooks.game.playerById(corpse.socketId));

              // Reward killer
            }
          }
        };

        sails.hooks.game.gameObject.searchForDead = setInterval(searchForDead, 1000);

        console.log('Game hook loaded');

        // Send the signal that the game hook has been loaded;
        sails.emit('hook:game:ready');
      });

      return done();
    },
    searchForDead: undefined,
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
    },
    startGame: function(mapId) {
      if (!sails.hooks.game.gameObject.maps[mapId]) {
        util.log('Map not found: ' + mapId);
        return;
      }
  
      var countdown = 4;
  
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
                    text = 'Game is starting ...';
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
    'sendTokensTo': async function(tokenReceiverAddress, amount) {
        // let tokenReceiverAddress     = "simpleledger:qr0ps2tv0n2r7qey6hta5erpgldgz8g9a55dn2sgty"; // <-- must be simpleledger format

        let fundingAddress           = "simpleledger:qqmsjlje4hxq99s6dlm8v0c0p6p39ht8suk6w73760"; // <-- must be bitcoincash format
        let fundingWif               = "KyCxcwBtsGWDuapgB6izmYsUTfZ5ErRJmUc87kwqCK9teviMztNe"; // <-- compressed WIF format
        let bchChangeReceiverAddress = "simpleledger:qqmsjlje4hxq99s6dlm8v0c0p6p39ht8suk6w73760"; // <-- simpleledger or bitcoincash format
        const tokenDecimals = 0; 
        
        let tokenId = "00ea27261196a411776f81029c0ebe34362936b4a9847deb1f7a40a02b3a1476";
        
        // 3) Calculate send amount in "Token Satoshis".  In this example we want to just send 1 token unit to someone...
        let sendAmount = (new BigNumber(amount)).times(10**tokenDecimals);  // Don't forget to account for token precision
        
        let balances; 
          balances = await bitboxproxy.getAllTokenBalances(fundingAddress);
        
          // Check for sufficient Token Balance
          if (tokenId in balances) {
            let balance = balances[tokenId].times(10**tokenDecimals);
            console.log("Token balance: " + balance.toString());
            
            if (sendAmount > balance) console.log("Insufficient token balance!");
          } else {
            console.log("Token has 0 balance");
          }
        
          // TODO: Check there is sufficient BCH balance to fund miners fee.  Look at balances.satoshis_available value.
        
          let txid;
          txid = await bitboxproxy.sendToken(tokenId, sendAmount, fundingAddress, fundingWif, tokenReceiverAddress, bchChangeReceiverAddress);
    },
    
    'takeTokensFrom': async function(fundingAddress, fundingWif, amount) {
        let rwcAddress = "simpleledger:qqmsjlje4hxq99s6dlm8v0c0p6p39ht8suk6w73760";
    },

  };

  return gameData;

};
