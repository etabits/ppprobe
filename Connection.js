'use strict'
const node_ssh = require('node-ssh')
const telnet = require('telnet-client')

class Connection {
  constructor (opts) {
    this.opts = opts
    this.type = this.opts.protocol
  }

  connect () {
    if ('ssh'==this.type) {
      this.conn = new node_ssh()
      return this.conn.connect(this.opts)
      .then(()=>this)
    } else if ('telnet'==this.type) {
      this.conn = new telnet();
      return this.conn.connect(Object.assign({
        timeout: 30e3,
        sendTimeout: 30e3,
        execTimeout: 30e3,
        port: 23,
      }, this.opts)).then(()=>this)
    }
  }

  exec (cmd) {
    // console.error('executing', cmd)
    if ('ssh'==this.type) {
      return this.conn.execCommand(cmd).then(function (res) {
        // console.error(res)
        return res.stdout
      })
    } else if ('telnet'==this.type) {
      return this.conn.exec(cmd)
    }
  }
}

module.exports = Connection
