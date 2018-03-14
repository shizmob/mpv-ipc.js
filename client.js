'use strict';
let BasicMPVClient = require('./base').BasicMPVClient;


function stripFirstWord(str) {
        return str.replace(/^[a-z]+/, '');
}

function toSnakeCase(str) {
        return str.replace(/([a-z])([A-Z])/, '$1_$2').toLowerCase();
}

function toDashCase(str) {
        return str.replace(/([a-z])([A-Z])/, '$1-$2').toLowerCase();
}

/* From https://github.com/mpv-player/mpv/blob/master/DOCS/man/ipc.rst#commands */
const IPC_COMMANDS = [
        "clientname",
        "gettimeus",
        "getproperty",
        "getpropertystring",
        "setproperty",
        "setpropertystring",
        "observeproperty",
        "observepropertystring",
        "unobserveproperty",
        "requestlogmessages",
        "enableevent",
        "disableevent",
        "getversion"
];


class MPVClient extends BasicMPVClient {

        constructor(...args) {
                super(...args);
                this.observe_property_id = 1;
                this.proxy = new Proxy(this, {
                        get: this._get
                });
                return this.proxy;
        }
        
        _get(target, property, receiver) {
                if (property in target) {
                        return target[property];
                } else if (IPC_COMMANDS.includes(property.toLowerCase())) {
                        property = toSnakeCase(property);
                        return function(...args) { return target.command(property, ...args); };
                } else if (property.startsWith("on")) {
                        property = toDashCase(stripFirstWord(property));
                        return function(...args) { return target.on(property, ...args); };
                } else if (property.startsWith("off")) {
                        property = toDashCase(stripFirstWord(property));
                        return function(...args) { return target.off(property, ...args); };
                } else if (property.startsWith("get")) {
                        property = toDashCase(stripFirstWord(property));
                        return function(...args) { return target.command("get_property", property, ...args); };
                } else if (property.startsWith("set")) {
                        property = toDashCase(stripFirstWord(property));
                        return function(...args) { return target.command("set_property", property, ...args); };
                } else if (property.startsWith("observe")) {
                        property = toDashCase(stripFirstWord(property));
                        return function(...args) { return target.observeProperty(property, ...args); };
                } else if (property.startsWith("toggle") || property.startsWith("cycle") && property !== "cycle") {
                        property = toDashCase(stripFirstWord(property));
                        return function(...args) { return target.command("cycle", property, ...args); };
                } else if (property.startsWith("adjust") || property.startsWith("add") && property !== "add") {
                        property = toDashCase(stripFirstWord(property));
                        return function(...args) { return target.command("add", property, ...args); };
                } else if (property.startsWith("scale") || property.startsWith("multiply") && property !== "multiply") {
                        property = toDashCase(stripFirstWord(property));
                        return function(...args) { return target.command("multiply", property, ...args); };
                } else {
                        property = toDashCase(property);
                        return function(...args) { return target.command(property, ...args); };
                }
        }

        observeProperty(name, cb) {
                let propertyID = this.observe_property_id++;
                let handle = this.proxy.onPropertyChange(e => {
                        if (e.id == propertyID && e.name == name && cb(e.data)) {
                                this.proxy.offPropertyChange(handle);
                                this.command("unobserve_property", propertyID);
                        }
                });
                this.command("observe_property", propertyID, name);
        }

        play()   { this.proxy.setPause(false); }
        pause()  { this.proxy.setPause(true); }
        resume() { this.proxy.setPause(false); }
        /* togglePause() handled by proxy */
        /* volume handled by proxy setVolume()/getVolume()/adjustVolume() */
        mute()   { this.proxy.setMute(true); }
        unmute() { this.proxy.setMute(false); }
        /* seek handled by proxy seek() */
        loop(n)  { this.proxy.setLoop(n < 0 ? "inf" : n); }
        /* audio tracks handled by proxy audioAdd()/audioRemove()/setAudio()/cycleAudio()/setAudioDelay() */
        /* subtitle tracks handled by proxy subAdd()/subRemove()/setSub()/cycleSub()/toggleSubVisibility()/setSubVisibility()/setSubDelay()/subSeek()/setSubScale() */
        /* video handled by proxy setFullscreen()/toggleFullscreen()/screenshotToFile()/setVideoRotate()/setVideoZoom()/setBrightness()/setContrast()/setSaturation()/setGamme()/setHue() */
        /* speed handled by proxy setSpeed() */
        /* loading handled by proxy loadlist()/loadfile() */
        /* playlist handled by proxy playlistNext()/playlistPrev()/playlistClear()/playlistRemove()/playlistRemove()/playlistShuffle() */

}


module.exports = { MPVClient };
