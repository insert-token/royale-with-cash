let vm = new Vue({
  el: '#home-wrap',
  data: {
    players: [

    ],
    updateIntervalId: undefined
  },
  mounted: function() {

    this.updateIntervalId = setInterval(()=>{
      this.players = window.g.remotePlayers.concat([ window.g.localPlayer ])
    }, 1000);
  },
  methods: {

  }
});
