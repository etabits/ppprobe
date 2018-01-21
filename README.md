# ppprobe
*(Formerly **connection-prober**)*

Drops and reconnects router's PPP connection until certain conditions are met (packet loss and ping time)

## Requirements
Node.js v8+

## Installation
```sh
npm install -g ppprobe
```
## Usage
```sh
ppprobe [router access] [formula]
```
* `[router access]` defaults to `telnet://admin:admin@192.168.1.1`
* `[formula]` defaults to `(ping + loss * 10) < 150`
### SSH Example (with a different formula)
```sh
ROUTER_PK=~/.ssh/router/id_rsa ppprobe ssh://admin@192.168.1.1:22 '(ping < 120) and (loss < 2)'
```
### Telnet Example
```sh
ppprobe telnet://admin:admin@192.168.1.1
```
