'use strict'
var node_ssh = require('node-ssh')
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
    }
  }

  exec (cmd) {
    // console.error('executing', cmd)
    if ('ssh'==this.type) {
      return this.conn.execCommand(cmd).then(function (res) {
        // console.error(res)
        return res.stdout
      })
    }
  }
}

module.exports = Connection
