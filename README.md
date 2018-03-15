# mpv-ipc.js

This is a simple, mostly dumb, client for [mpv](https://mpv.io)'s [IPC interface](https://github.com/mpv-player/mpv/blob/master/DOCS/man/ipc.rst).
It translates any method calls into IPC commands for mpv according to the following rules:

* Explicitly implemented commands like `observeProperty()` (see [commands](#explicit-commands) below) go first;
* Known IPC commands as listed in the IPC interface (such as `clientName()` -> `client_name`) are then tested;
* Methods starting with `on` or `off` are translated into event handler addition/deletion for their corresponding dash-case events;
* Methods starting with `get`, `set`, `observe`, `toggle`/`cycle`, `adjust`/`add`, `scale`/`multiply` are translated into
  their corresponding `get_property`, `set_property`, `observe_property`, `cycle`, `add` and `multiply` commands with the property translated to dash-case;
* Finally, the entire command is translated into dash-case and attempted as an IPC-style input command.

The IPC interface is fully asynchronous and every command (except for event handler registration) returns a 
[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise).
On success, `resolve()` is called with the result data and on failure `reject()` is called with the error message from mpv.

## Explicit commands

* `MPVClient(socketPath)`: create a client communicating with the IPC socket on `socketPath`;
* `MPVClient.on(event, handler)`: register an event handler for raw IPC event `event`;
* `MPVClient.off(event, handler)`: unregister an event handler for raw IPC event `event`;
* `MPVClient.command(...args)`: send raw command over IPC interface (equivalent to `socket.write(JSON.stringify({command: args}))`);
* `MPVClient.observeProperty(property, handler)`: observe changes for the given `property` and invoke `handler` with the new value once it changes;
* `MPVClient.play()`: alias for `MPVClient.setPause(false)`;
* `MPVClient.pause()`: alias for `MPVClient.setPause(true)`;
* `MPVClient.resume()`: alias for `MPVClient.setPause(false)`;
* `MPVClient.mute()`: alias for `MPVClient.setMute(true)`;
* `MPVClient.unmute()`: alias for `MPVClient.setMute(false)`;
* `MPVClient.loop()`: alias for `MPVClient.setLoop(n < 0 ? "inf" : n)`;

## Example

```js
let mpv = require('mpv-ipc');
let player = new mpv.MPVClient('/tmp/mpv.sock');

/** Basic IPC commands */

player.getProperty('volume').then(v => console.log('Volume: ' + v));
/* or: */
player.getVolume().then(v => console.log('Volume: ' + v));

player.adjustVolume(5); /* raise volume by 5 */

player.observeProperty('media-title', t => console.log('Title changed: ' + t));
/* or: */
player.observeMediaTitle(t => console.log('Title changed: ' + t));

player.on('end-file', e => console.log('File ended.'));
/* or: */
player.onEndFile(e => console.log('File ended.'));

/** Making use of the input interface (https://github.com/mpv-player/mpv/blob/master/DOCS/man/input.rst) */

/* As every function just returns a promise, you can use the async/await functionality for cleaner access,
 * especially if you want to wait for events. */
async function f(player) {
    await player.loadfile('/Users/you/Downloads/not-an-anime-episode.mkv');
    await player.seek(420, 'absolute');
    await player.screenshotToFile('/Users/you/Pictures/lewd-scene.png', 'video');
}
```

## License

mpv-ipc.js is released under the [0BSD](https://spdx.org/licenses/0BSD.html) license:

```
Copyright (C) 2018 by Shiz <hi@shiz.me>

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN 
NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, 
WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```
