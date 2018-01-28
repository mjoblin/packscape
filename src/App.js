import React from 'react';
import ReactDOM from 'react-dom';
import Packscape from './components/Packscape/Packscape';
import EventEmitter from 'events';

import styles from './app.sass';


// ---------------------------------------------------------------------------
// Event emitter
//
// This event emitter is used to emit all incoming dumplings to any interested
// React components in the application.

class DumplingEmitter extends EventEmitter {}

const dumplingEmitter = new DumplingEmitter();
dumplingEmitter.setMaxListeners(100);


// ---------------------------------------------------------------------------
// Websocket
//
// Connect to shifty and emit every incoming dumpling on a channel named
// after each dumpling chef.  This will normally be "PacketCountChef" (that's
// the only chef we care about for this).

let ws = new WebSocket("ws://10.0.1.12:11348/");

ws.onopen = () => {
    // Send shifty our name.  This prompts shifty to start sending us all
    // its subsequent dumplings.
    ws.send(JSON.stringify({eater_name: "packscape"}));
};

ws.onmessage = (event) => {
    // Emit every incoming dumpling on a channel with the same name as the
    // dumpling's chef.
    let dumpling = JSON.parse(event.data);
    dumplingEmitter.emit(dumpling.metadata.chef, dumpling.payload);
};


// ---------------------------------------------------------------------------
// Audio

/*
let audioContext = new (window.AudioContext || window.webkitAudioContext)();

function effect() {
    var convolver = audioContext.createConvolver(),
        noiseBuffer = audioContext.createBuffer(2, 0.5 * audioContext.sampleRate, audioContext.sampleRate),
        left = noiseBuffer.getChannelData(0),
        right = noiseBuffer.getChannelData(1);
    for (var i = 0; i < noiseBuffer.length; i++) {
        left[i] = Math.random() * 2 - 1;
        right[i] = Math.random() * 2 - 1;
    }
    convolver.buffer = noiseBuffer;
    return convolver;
};

let gain = audioContext.createGain();
gain.gain.value = 1;

let convolver = effect();
convolver.connect(gain);

let osc = audioContext.createOscillator();
osc.type = 'sine';
osc.frequency.value = 220;
osc.detune.value = 0;
osc.connect(convolver);
osc.start(0);

gain.connect(audioContext.destination);
*/


// ---------------------------------------------------------------------------
// Render the application.

let App = ReactDOM.render(
    <Packscape
        dumplingEmitter={dumplingEmitter}
    />,
    document.getElementById("app")
);

export default App;
