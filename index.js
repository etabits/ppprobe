#!/usr/bin/env node
'use strict'
const Prober = require('./Prober')
const Connection = require('./Connection')

var connectionParams = require('url').parse(process.argv[2]||'telnet://admin:admin@192.168.1.1')
var [username, password] = connectionParams.auth.split(':')
var opts = {
  username,
  password,
  host: connectionParams.hostname,

  formula: process.argv[3] || '(ping + loss * 10) < 150',
  protocol: connectionParams.protocol.split(':')[0],
}
if (connectionParams.port) {
  opts.port = connectionParams.port
}
if (opts.protocol=='ssh') {
  opts.privateKey = process.env.ROUTER_PK
}
var cp = new Prober(opts)
cp.fix()
