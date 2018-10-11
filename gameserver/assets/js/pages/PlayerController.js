let vm = new Vue({
  el: '#home-wrap',
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

    this.updateIntervalId = setInterval(this.updatePlayers, 1000);

    io.socket.on('inputName', () => {
      var playerName = prompt('Please enter your name.') || 'Greg Maxwell';
      io.socket.post('/setPlayerName', { name: playerName }, (serverResponse) => {
        this.user = serverResponse;
        io.socket.post('/getMap', { mapId: g.mapId });
      });
    });

    // Tell the socket we're here and fetch any session
    // data that has been stored for the user.
    io.socket.get('/check-in', (userObject) => {
      if (userObject.name) {
        this.user = userObject;
        io.socket.post('/getMap', { mapId: g.mapId });
      }
    });
  },
  methods: {
    updatePlayers: function() {
      this.players = window.g.remotePlayers.concat([ window.g.localPlayer ]);
    }
  }
});
