let vm = Vue({
  el: '#stats',
  data: {
    players: [{
        name: 'Matt',
        tokens: 5,
        alive: false,
        txlink: 'link'
      },
      {
        name: 'Rob',
        tokens: 0,
        alive: true,
        txlink: 'link'
      },
      {
        name: 'Nick',
        tokens: '2',
        alive: false,
        txlink: 'link'
      }
    ]
  }
})
