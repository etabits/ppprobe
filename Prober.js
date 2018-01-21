'use strict'
const { spawn } = require('child_process')
const readline = require('readline')
const Connection = require('./Connection')

var Parser = require('expr-eval').Parser;
const chalk = require('chalk')

function write(str) {
  process.stdout.write(str)
}

function colorize(text, value, valmax, valmin=0, huemax=0, huemin=120) {
  if (value > valmax) value = valmax;
  else if (value < valmin) value = valmin;
  var hue = (value-valmin)/(valmax-valmin) * (huemax-huemin) + huemin

  return chalk.hsl(hue, 88, 50)(text)
}

function wait(seconds) {
  return new Promise(function (resolve) {
    setTimeout(resolve, seconds*1e3)
  })
}

class Prober {
  constructor(opts) {
    this.opts = opts
    this.parser = new Parser();
    this.expr = this.parser.parse(this.opts.formula)
  }

  fix() {
    return this.round()
  }

  acceptable(res) {
    var self = this
    return this.expr.evaluate({
      ping: res.avg,
      loss: res.loss
    })
  }

  round () {
    var self = this
    write('checking ping')
    return this.checkPing()
    .then(function(res) {
      write(`: loss=${res.loss}%, avg=${res.avg}ms `)
      if (self.acceptable(res)) {
        write('(acceptable, exiting!)\n')
        if (self.conn) self.conn.exec('exit').then(function () {
          console.log('exited')
        })
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
    return new Promise(function (resolve, reject) {
      var ping = spawn('ping', ['-O', '-n', '-i', '0.2', '-c', count, target])
      var rl = readline.createInterface({input: ping.stdout})
      var stats = {
        total: 0,
        reply: 0,
        times: 0,
        avg: Infinity
      }
      var unparsedLines = ''
      rl.on('line', function (line) {
        var info = {};
        line.replace(/(\w+)=(\d+)/g, function (all, label, val) {
          info[label] = parseFloat(val)
        })
        if (typeof info.icmp_seq == 'undefined') {
          unparsedLines += line + '\n'
          return;
        } if (info.ttl) { // reply
          stats.reply++
          stats.times += info.time
        }
        stats.total = Math.max(stats.total, info.icmp_seq)
        stats.avg = stats.times / stats.reply
        stats.loss = 100-(stats.reply*100/stats.total)

        write(`  \r${
          colorize(Math.round(stats.loss), stats.loss, 30)
        }% @ ${
          colorize(stats.avg.toFixed(3), stats.avg, 150, 50)
        }ms (${stats.reply}/${stats.total}/${count})`)
      })
      ping.on('exit', function () {
        var loss, avg
        try {
          loss = parseInt(unparsedLines.match(/(\d+)% packet loss/)[1])
          avg = parseFloat(unparsedLines.match(/min\/avg\/max\/mdev = ([0-9.]+)\/([0-9.]+)/)[2])
        } catch (e) {
          resolve({loss:100,avg:Infinity})
          return;
        }

        resolve({loss, avg})
      })
    });
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
