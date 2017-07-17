# connection-prober
Drops and reconnects router's PPP connection until certain conditions are met (packet loss and ping time)

## Requirements
Node.js v8.x

## Setup
```sh
git clone https://github.com/aularon/connection-prober
cd connection-prober/
npm i
```
## Usage
### SSH
```sh
./index.js ssh://admin@192.168.1.1:22 ~/.ssh/router/id_rsa
```
### Telnet
*(Not currently integrated in this repository, need to test it when I have access to the old router!)*
```sh
./index.js telnet://admin:admin@192.168.1.1
```
