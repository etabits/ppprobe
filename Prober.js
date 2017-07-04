'use strict'
const exec = require('util').promisify(require('child_process').execFile)
const Connection = require('./Connection')

function write(str) {
  process.stdout.write(str)
}

function wait(seconds) {
  return new Promise(function (resolve) {
    setTimeout(resolve, seconds*1e3)
  })
}

class Prober {
  constructor(opts) {
    this.opts = opts
  }

  fix() {
    console.log(this.opts)
    return this.round()
  }

  round () {
    var self = this
    write('checking ping')
    var i = setInterval(()=>write('.'), 1e3)
    return this.checkPing()
    .then(function(res) {
      clearInterval(i)
      write(`: loss=${res.loss}%, avg=${res.avg}ms `)
      if (res.avg <= self.opts.maxPing && res.loss <= self.opts.maxLoss) {
        write('(acceptable, exiting!)\n')
        if (self.conn) self.conn.exec('exit')
        return
      }
      write('\n')
      return self.acquireConnection()
      .then(function () {
        write('killing connection... ')
        return self.conn.exec('killall pppd').then(()=>wait(9))
      })
      .then(function() {
        write('reconnecting')
        return self.conn.exec(self.pppCmd)
      }).then(function(connResult) {
        write('connected: '+ /local\s+IP\s+address\s+([0-9.]+)/i.exec(connResult)[1]+'\n')
        return self.round()
      })
    })
  }

  checkPing (count=65, target='8.8.8.8') {
    return exec('ping', ['-q', '-i', '0.2', '-c', count, target]).then(function(res) {
      var loss, avg
      try {
        loss = parseInt(res.stdout.match(/(\d+)% packet loss/)[1])
        avg = parseFloat(res.stdout.match(/min\/avg\/max\/mdev = ([0-9.]+)\/([0-9.]+)/)[2])
      } catch (e) {
        console.log(e, res)
      }
      return {loss, avg}
    }).catch(()=>({loss:100,avg:999}))
  }


  acquireConnection () {
    if (this.conn) return Promise.resolve(this.conn)
    var self = this
    console.log('establishing connection to the router...')
    var c = this.conn = new Connection(this.opts)
    return c.connect().then(function () {
      return c.exec('cat /var/tmp/ppp0.conf').then(function (cmd) {
        self.pppCmd = cmd.replace('nodetach', 'updetach').replace('&', '').trim()
      })
    }).then(()=>c)
    return this.conn.connect({
      execTimeout: 30e3,
      sendTimeout: 30e3,
      host: this.opts.hostname,
      port: this.opts.port,
      username: this.opts.username,
      password: this.opts.password,
    }).then(function (argument) {
      // body...
    })
  }
}

module.exports = Prober
