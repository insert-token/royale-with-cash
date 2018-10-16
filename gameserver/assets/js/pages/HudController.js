let hc = new Vue({
    el: '#i-dont-actually-know-how-to-vue',
    data: {
      players: [],
      user: {
        name: ''
      },
      updateIntervalId: undefined
    },
    beforeMount: function() {
        
    },
    mounted: function() {
      io.socket.on('death', (dead) => {
        console.log(`${dead.whoKilledMe.name} killed ${dead.name}`);

        if (dead.id === g.localPlayer.id) {
            // we ded
            var middleText = g.hud.getAt(g.hud.middleText);
            middleText.text = "YOU DED";
            game.tweens.create(middleText).to({ alpha: 0 }, 2000, null, true).onComplete.addOnce(function() {
                this.text = '';
                this.alpha = 1;
            }, middleText);
        }
      });
    },

    methods: {
      updatePlayers: function() {
        // this.players = window.g.remotePlayers.concat([ window.g.localPlayer ]);
      }
    }
  });
  