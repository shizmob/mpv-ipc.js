'use strict';
let net = require('net');
let debug = require('debug')('mpv-ipc');

class BasicMPVClient {

        constructor(socketPath) {
                this.handlers = {};
                this.commands = {};
                this.request_id = 1;
                this.socket = net.createConnection(socketPath);
                this.socket.on("data", data => this.handleData(data));
        }

        on(event, handler) {
                this.handlers[event] = this.handlers[event] || [];
                this.handlers[event].push(handler);
                return handler;
        }

        off(event, handler) {
                this.handlers[event] = this.handlers[event].filter(h => h !== handler);
        }

        dispatch(event, ...args) {
                if (!(event in this.handlers))
                        return;
                for (var h of this.handlers[event]) {
                        h(...args);
                }
        }

        handleData(data) {
                let events = data.toString().trim().split("\n");
                for (var e of events) {
                        debug('<- ' + e);

                        let evt = JSON.parse(e);
                        if (evt.request_id) {
                                let [resolve, reject] = this.commands[evt.request_id];
                                delete this.commands[evt.request_id];
                                (evt.error == "success") ? resolve(evt.data) : reject(evt.error);
                        } else {
                                this.dispatch("event", evt);
                                this.dispatch(evt.event, evt);
                        }
                }
        }

        command(...args) {
                let p = new Promise((resolv, reject) => {
                        this.commands[this.request_id] = [resolv, reject];
                });
                let command = JSON.stringify({command: args, request_id: this.request_id});
                this.socket.write(command + "\n");
                this.request_id++;

                debug('-> ' + command);
                return p;
        }

}


module.exports = { BasicMPVClient };
